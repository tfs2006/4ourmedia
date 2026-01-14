import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: false }
};

// Credit amounts for each plan
const PLAN_CREDITS: Record<string, number> = {
  starter: 25,
  pro: 100,
  agency: 500
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Add credits to user in Supabase
async function addCreditsToUser(userId: string, credits: number, stripeSessionId: string, planId: string, amountCents: number) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase not configured');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
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
  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      stripe_session_id: stripeSessionId,
      plan_id: planId,
      credits,
      amount_cents: amountCents,
      status: 'completed'
    });
  
  if (purchaseError) {
    console.error('Error recording purchase:', purchaseError);
    // Don't fail - credits were added
  }
  
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Payment system not configured' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Payment successful:', session.id);
        
        // Get user ID and plan from metadata
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId || 'pro';
        const credits = PLAN_CREDITS[planId] || 100;
        
        if (userId) {
          // Add credits to Supabase
          const success = await addCreditsToUser(
            userId, 
            credits, 
            session.id, 
            planId,
            session.amount_total || 0
          );
          
          if (success) {
            console.log(`✅ Added ${credits} credits to user ${userId}`);
          } else {
            console.error(`❌ Failed to add credits to user ${userId}`);
          }
        } else {
          console.log('No userId in metadata - credits will be added on verify');
        }
        break;
      }
      case 'customer.subscription.deleted':
        console.log('❌ Subscription cancelled');
        break;
      default:
        console.log(`Event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}
