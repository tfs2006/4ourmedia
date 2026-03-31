import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { ACTIVE_PLAN_IDS, ACTIVE_PRICING_PLANS, formatPricePerCredit } from '../lib/pricingRuntime.js';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    stripe = new Stripe(key, {
      httpClient: Stripe.createNodeHttpClient(),
      maxNetworkRetries: 3,
      timeout: 30000,
    });
  }
  return stripe;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(randomBytes(2).toString('hex').toUpperCase());
  }
  return `PROMO-${segments.join('-')}`;
}

async function ensureCreditsAdded(userId: string, credits: number, sessionId: string, planId: string, amountCents: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !userId) {
    return false;
  }

  const { data: existingPurchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .single();

  if (existingPurchase) {
    return true;
  }

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('credits, total_purchased')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return false;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      credits: (user?.credits || 0) + credits,
      total_purchased: (user?.total_purchased || 0) + credits,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating credits:', updateError);
    return false;
  }

  await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      stripe_session_id: sessionId,
      plan_id: planId,
      credits,
      amount_cents: amountCents,
      status: 'completed',
    });

  return true;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function handleInfo(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.json({
    available: !!process.env.STRIPE_SECRET_KEY,
    tiers: Object.fromEntries(
      ACTIVE_PLAN_IDS.map((planId) => {
        const plan = ACTIVE_PRICING_PLANS[planId];
        return [
          planId,
          {
            name: plan.name,
            credits: plan.credits,
            price: plan.priceInCents / 100,
            perCredit: Number(formatPricePerCredit(plan.id).replace('$', '')),
          },
        ];
      })
    ),
  });
}

async function handleCheckout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const stripeClient = getStripe();
  const { successUrl, cancelUrl, planId = 'pro', userId, userEmail } = req.body || {};
  const tier = ACTIVE_PRICING_PLANS[planId as keyof typeof ACTIVE_PRICING_PLANS];

  if (!tier) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  const origin = req.headers.origin || req.headers.referer || 'https://www.4ourmedia.com';

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `PromoGen - ${tier.name}`,
            description: `${tier.credits} PromoGen credits`,
          },
          unit_amount: tier.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl || `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${origin}/#pricing`,
    customer_email: userEmail || undefined,
    metadata: {
      planId,
      credits: String(tier.credits),
      userId: userId || '',
      userEmail: userEmail || '',
    },
  });

  return res.json({ url: session.url, sessionId: session.id });
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, userId } = req.body || {};
  if (!process.env.STRIPE_SECRET_KEY || !sessionId) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const stripeClient = getStripe();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Payment not completed' });
  }

  const email = session.customer_details?.email || 'customer@email.com';
  const credits = session.metadata?.credits ? parseInt(session.metadata.credits) : 100;
  const planId = session.metadata?.planId || 'pro';
  const finalUserId = userId || session.metadata?.userId;

  if (finalUserId) {
    await ensureCreditsAdded(finalUserId, credits, sessionId, planId, session.amount_total || 0);
  }

  return res.json({
    success: true,
    license: {
      key: generateLicenseKey(),
      email,
      credits,
      planId,
      purchaseDate: new Date().toISOString(),
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const op = String(req.query.op || '');

  try {
    if (op === 'checkout') {
      return await handleCheckout(req, res);
    }
    if (op === 'verify') {
      return await handleVerify(req, res);
    }
    if (op === 'info') {
      return await handleInfo(req, res);
    }
    return res.status(400).json({ error: 'Unknown purchase operation' });
  } catch (error: any) {
    console.error('Purchase endpoint error:', {
      op,
      message: error?.message,
      type: error?.type || error?.constructor?.name,
      code: error?.code,
      statusCode: error?.statusCode,
    });

    return res.status(500).json({
      error: error?.message || 'Purchase request failed',
      errorType: error?.type || error?.constructor?.name || 'Unknown',
    });
  }
}