import { createClient, User, Session } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Auth features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ Auth Functions ============

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export async function signUpWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    
    if (data.user) {
      // Create user profile in our users table
      await createUserProfile(data.user.id, email);
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name
        },
        error: null
      };
    }
    
    return { user: null, error: 'Check your email to confirm your account!' };
  } catch (err: any) {
    return { user: null, error: err.message };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    
    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name
        },
        error: null
      };
    }
    
    return { user: null, error: 'Login failed' };
  } catch (err: any) {
    return { user: null, error: err.message };
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url
    };
  }
  
  return null;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Listen for auth state changes
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Create user profile if it doesn't exist (handles Google OAuth and other providers)
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        await createUserProfile(session.user.id, session.user.email || '');
      }
      
      callback({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
        avatar: session.user.user_metadata?.avatar_url
      });
    } else {
      callback(null);
    }
  });
}

// ============ User Profile Functions ============

async function createUserProfile(userId: string, email: string) {
  // First check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  // Only create profile if user doesn't exist
  if (!existingUser) {
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        credits: 3, // Start with 3 free credits
        total_purchased: 0,
        total_used: 0,
        streak_days: 0,
        last_daily_credit: null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating user profile:', error);
    }
  }
}

// ============ Credits Functions ============

export interface UserCredits {
  credits: number;
  totalPurchased: number;
  totalUsed: number;
  lastDailyCredit: string | null;
  streakDays: number;
}

export async function getUserCredits(userId: string): Promise<UserCredits> {
  const { data, error } = await supabase
    .from('users')
    .select('credits, total_purchased, total_used, last_daily_credit, streak_days')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return { 
      credits: 3, 
      totalPurchased: 0, 
      totalUsed: 0, 
      lastDailyCredit: null, 
      streakDays: 0 
    };
  }

  return {
    credits: data.credits || 0,
    totalPurchased: data.total_purchased || 0,
    totalUsed: data.total_used || 0,
    lastDailyCredit: data.last_daily_credit,
    streakDays: data.streak_days || 0
  };
}

export async function useCredit(userId: string, amount = 1): Promise<{ success: boolean; remaining: number }> {
  if (amount <= 1) {
    const { data, error } = await supabase
      .rpc('use_credit', { user_uuid: userId })
      .single();

    const typedData = data as { success?: boolean; remaining?: number } | null;

    if (error) {
      console.error('Error using credit (atomic):', error);
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();
      return { success: false, remaining: user?.credits || 0 };
    }

    return { success: typedData?.success ?? false, remaining: typedData?.remaining ?? 0 };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('credits, total_used')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      console.error('Error fetching credits for multi-credit charge:', fetchError);
      return { success: false, remaining: 0 };
    }

    if ((user.credits || 0) < amount) {
      return { success: false, remaining: user.credits || 0 };
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('users')
      .update({
        credits: user.credits - amount,
        total_used: (user.total_used || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('credits', user.credits)
      .select('credits')
      .single();

    if (!updateError && updatedRow) {
      return { success: true, remaining: updatedRow.credits || 0 };
    }
  }

  const { data: latestUser } = await supabase
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  return { success: false, remaining: latestUser?.credits || 0 };
}

export async function addCredits(userId: string, amount: number, stripeSessionId?: string): Promise<boolean> {
  // Use the atomic DB function to safely add credits
  const { data: newCredits, error } = await supabase
    .rpc('add_credits', { user_uuid: userId, amount });

  if (error) {
    console.error('Error adding credits (atomic):', error);
    return false;
  }

  // Record purchase for audit trail
  if (stripeSessionId) {
    await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        stripe_session_id: stripeSessionId,
        credits: amount,
        created_at: new Date().toISOString()
      });
  }

  return true;
}

export async function claimDailyCredit(userId: string): Promise<{ success: boolean; credits: number; bonusCredits: number; streakDays: number }> {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits, last_daily_credit, streak_days')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { success: false, credits: 0, bonusCredits: 0, streakDays: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastClaim = user.last_daily_credit?.split('T')[0];

  // Already claimed today
  if (lastClaim === today) {
    return { success: false, credits: user.credits, bonusCredits: 0, streakDays: user.streak_days || 0 };
  }

  // Calculate streak
  let newStreakDays = 1;
  if (lastClaim === yesterday) {
    newStreakDays = (user.streak_days || 0) + 1;
  }

  // Bonus credits for streaks
  let bonusCredits = 0;
  if (newStreakDays === 7) bonusCredits = 2;
  if (newStreakDays === 30) bonusCredits = 5;

  const totalCredits = 1 + bonusCredits;

  // Update user
  const { error } = await supabase
    .from('users')
    .update({
      credits: user.credits + totalCredits,
      last_daily_credit: new Date().toISOString(),
      streak_days: newStreakDays
    })
    .eq('id', userId);

  if (error) {
    return { success: false, credits: user.credits, bonusCredits: 0, streakDays: user.streak_days || 0 };
  }

  return { 
    success: true, 
    credits: user.credits + totalCredits, 
    bonusCredits, 
    streakDays: newStreakDays 
  };
}

export async function checkDailyCredit(userId: string): Promise<{ available: boolean; streakDays: number }> {
  const { data: user, error } = await supabase
    .from('users')
    .select('last_daily_credit, streak_days')
    .eq('id', userId)
    .single();

  if (error || !user) {
    return { available: true, streakDays: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const lastClaim = user.last_daily_credit?.split('T')[0];

  return {
    available: lastClaim !== today,
    streakDays: user.streak_days || 0
  };
}

// ============ History Functions ============

export async function savePromoToHistory(
  userId: string,
  url: string,
  analysis: any,
  backgroundImage: string,
  finalImage: string,
  brandKitId?: string
): Promise<string | null> {
  // Truncate large base64 images to avoid row size limits
  // Store just a thumbnail or reference instead of full image
  const maxImageLength = 500000; // ~500KB limit per image
  const truncatedBg = backgroundImage.length > maxImageLength 
    ? backgroundImage.substring(0, maxImageLength) 
    : backgroundImage;
  const truncatedFinal = finalImage.length > maxImageLength 
    ? finalImage.substring(0, maxImageLength) 
    : finalImage;
  
  console.log('Saving to history:', { 
    userId, 
    url, 
    bgLength: truncatedBg.length, 
    finalLength: truncatedFinal.length 
  });
  
  const { data, error } = await supabase
    .from('promo_history')
    .insert({
      user_id: userId,
      url,
      analysis,
      background_image: truncatedBg,
      final_image: truncatedFinal,
      brand_kit_id: brandKitId,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving to history:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return null;
  }

  console.log('History saved successfully:', data?.id);
  return data?.id || null;
}

export async function getPromoHistory(userId: string, limit = 50): Promise<any[]> {
  const { data, error } = await supabase
    .from('promo_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

export async function deletePromoFromHistory(userId: string, promoId: string): Promise<boolean> {
  const { error } = await supabase
    .from('promo_history')
    .delete()
    .eq('id', promoId)
    .eq('user_id', userId);

  return !error;
}
