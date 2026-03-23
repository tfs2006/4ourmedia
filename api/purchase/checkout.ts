import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { ACTIVE_PRICING_PLANS } from '../../lib/pricing';

// Initialize Stripe once at module level (avoids cold-start overhead per request)
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
    stripe = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripe;
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
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `PromoGen - ${tier.name}`,
            description: `${tier.credits} PromoGen credits`,
          },
          unit_amount: tier.priceInCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/#pricing`,
      customer_email: userEmail || undefined,
      metadata: { 
        planId, 
        credits: String(tier.credits),
        userId: userId || '',
        userEmail: userEmail || ''
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout error:', {
      message: error.message,
      type: error.type || error.constructor?.name,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout',
      errorType: error.type || error.constructor?.name || 'Unknown',
    });
  }
}
