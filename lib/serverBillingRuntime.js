import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service role is not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function getAuthorizationHeader(headers) {
  const rawHeader = headers.authorization || headers.Authorization;
  if (Array.isArray(rawHeader)) {
    return rawHeader[0] || '';
  }
  return rawHeader || '';
}

export async function verifyAuthenticatedUser(headers) {
  const authorization = getAuthorizationHeader(headers);
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
}

export async function consumeUserCredits(userId, amount) {
  const supabase = getSupabaseAdmin();

  if (amount <= 1) {
    const { data, error } = await supabase.rpc('use_credit', { user_uuid: userId }).single();
    if (error) {
      const { data: user } = await supabase.from('users').select('credits').eq('id', userId).single();
      return { success: false, remaining: user?.credits || 0 };
    }

    return {
      success: data?.success ?? false,
      remaining: data?.remaining ?? 0,
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('credits, total_used')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return { success: false, remaining: 0 };
    }

    if ((user.credits || 0) < amount) {
      return { success: false, remaining: user.credits || 0 };
    }

    const { data: updatedUser, error: updateError } = await supabase
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

    if (!updateError && updatedUser) {
      return { success: true, remaining: updatedUser.credits || 0 };
    }
  }

  const { data: latestUser } = await supabase.from('users').select('credits').eq('id', userId).single();
  return { success: false, remaining: latestUser?.credits || 0 };
}

export async function refundUserCredits(userId, amount) {
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from('users')
    .select('credits, total_used')
    .eq('id', userId)
    .single();

  if (!user) {
    return;
  }

  await supabase
    .from('users')
    .update({
      credits: (user.credits || 0) + amount,
      total_used: Math.max(0, (user.total_used || 0) - amount),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
}