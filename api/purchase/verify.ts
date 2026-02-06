import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(randomBytes(2).toString('hex').toUpperCase());
  }
  return `PROMO-${segments.join('-')}`;
}

// Add credits to user in Supabase (fallback if webhook didn't process)
async function ensureCreditsAdded(userId: string, credits: number, sessionId: string, planId: string, amountCents: number) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey || !userId) {
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check if this purchase was already processed
  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .single();
  
  if (existingPurchase) {
    console.log('Purchase already processed:', sessionId);
    return true;
  }
  
  // Get current user credits
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits, total_purchased')
    .eq('id', userId)
    .single();
  
  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return false;
  }
  
  // Update credits
  const { error: updateError } = await supabase
    .from('users')
    .update({
      credits: (user?.credits || 0) + credits,
      total_purchased: (user?.total_purchased || 0) + credits
    })
    .eq('id', userId);
  
  if (updateError) {
    console.error('Error updating credits:', updateError);
    return false;
  }
  
  // Record purchase
  await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      stripe_session_id: sessionId,
      plan_id: planId,
      credits,
      amount_cents: amountCents,
      status: 'completed'
    });
  
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, userId } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY || !sessionId) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      httpClient: Stripe.createNodeHttpClient(),
      maxNetworkRetries: 3,
      timeout: 30000,
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      const email = session.customer_details?.email || 'customer@email.com';
      const credits = session.metadata?.credits ? parseInt(session.metadata.credits) : 100;
      const planId = session.metadata?.planId || 'pro';
      
      // Use userId from request body or from session metadata
      const finalUserId = userId || session.metadata?.userId;
      
      // Ensure credits are added to Supabase (in case webhook didn't process)
      if (finalUserId) {
        await ensureCreditsAdded(
          finalUserId,
          credits,
          sessionId,
          planId,
          session.amount_total || 0
        );
      }
      
      res.json({ 
        success: true, 
        license: {
          key: generateLicenseKey(),
          email,
          credits,
          planId,
          purchaseDate: new Date().toISOString()
        }
      });
    } else {
      res.status(402).json({ error: 'Payment not completed' });
    }
  } catch (error: any) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
}
