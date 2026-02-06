import dns from 'node:dns';
// Force IPv4 to avoid Vercel/AWS IPv6 timeout issues
dns.setDefaultResultOrder('ipv4first');

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const PRICING_TIERS: Record<string, { name: string; credits: number; priceInCents: number; isSubscription?: boolean }> = {
  starter: { name: 'Starter Pack', credits: 25, priceInCents: 900 },
  pro: { name: 'Pro Pack', credits: 100, priceInCents: 2900 },
  agency: { name: 'Agency Pack', credits: 500, priceInCents: 9900 },
  unlimited: { name: 'Unlimited Monthly', credits: -1, priceInCents: 1900, isSubscription: true }
};

import https from 'https';

// Initialize Stripe once at module level (avoids cold-start overhead per request)
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured');

    // DEBUG: Log DNS resolution for Stripe API
    dns.lookup('api.stripe.com', (err, address, family) => {
      console.log('DNS Lookup for api.stripe.com:', { err, address, family });
    });

    // Vercel/AWS Lambda Fix: Disable keep-alive to prevent frozen sockets
    const agent = new https.Agent({ keepAlive: false });

    stripe = new Stripe(key, {
      httpAgent: agent,
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
    const tier = PRICING_TIERS[planId];

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
            description: tier.credits === -1
              ? 'Unlimited AI promo generations per month'
              : `${tier.credits} AI promo generation credits`,
          },
          unit_amount: tier.priceInCents,
          ...(tier.isSubscription ? { recurring: { interval: 'month' as const } } : {})
        },
        quantity: 1,
      }],
      mode: tier.isSubscription ? 'subscription' : 'payment',
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
      stack: error.stack
    });
    res.status(500).json({
      error: error.message || 'Failed to create checkout',
      errorType: error.type || error.constructor?.name || 'Unknown',
      details: 'Please check server logs for more information'
    });
  }
}
