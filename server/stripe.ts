import Stripe from 'stripe';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Initialize Stripe - set your secret key in environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  httpClient: Stripe.createNodeHttpClient(),
  maxNetworkRetries: 3,
  timeout: 30000,
}) : null;

// Product configuration with multiple plans
export const PRICING_PLANS: Record<string, {
  name: string;
  description: string;
  priceInCents: number;
  credits: number;
  mode: 'payment' | 'subscription';
  interval?: 'month' | 'year';
}> = {
  starter: {
    name: '4ourMedia PromoGen - Starter Pack',
    description: '25 promo generation credits. Never expires.',
    priceInCents: 900, // $9
    credits: 25,
    mode: 'payment'
  },
  pro: {
    name: '4ourMedia PromoGen - Pro Pack',
    description: '100 promo generation credits. All templates. All sizes. Never expires.',
    priceInCents: 2900, // $29
    credits: 100,
    mode: 'payment'
  },
  agency: {
    name: '4ourMedia PromoGen - Agency Pack',
    description: '500 promo generation credits. All features. Bulk generation. White-label. Never expires.',
    priceInCents: 9900, // $99
    credits: 500,
    mode: 'payment'
  },
  unlimited: {
    name: '4ourMedia PromoGen - Unlimited Monthly',
    description: 'Unlimited promo generations. All features. Cancel anytime.',
    priceInCents: 1900, // $19/month
    credits: -1, // Unlimited
    mode: 'subscription',
    interval: 'month'
  }
};

// Legacy product config for backwards compatibility
export const PRODUCT_CONFIG = PRICING_PLANS.pro;

// License management
const LICENSES_FILE = path.join(process.cwd(), 'config', 'licenses.json');

export interface License {
  key: string;
  email: string;
  purchasedAt: string;
  stripeSessionId: string;
  downloadCount: number;
  planId: string;
  credits: number;
  isUnlimited: boolean;
  subscriptionExpiry?: string;
}

function getLicenses(): Record<string, License> {
  if (!fs.existsSync(LICENSES_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveLicenses(licenses: Record<string, License>) {
  const configDir = path.dirname(LICENSES_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2));
}

export function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return segments.join('-'); // Format: XXXX-XXXX-XXXX-XXXX
}

export function createLicense(email: string, stripeSessionId: string, planId: string = 'pro'): License {
  const licenses = getLicenses();
  const plan = PRICING_PLANS[planId] || PRICING_PLANS.pro;
  
  const license: License = {
    key: generateLicenseKey(),
    email,
    purchasedAt: new Date().toISOString(),
    stripeSessionId,
    downloadCount: 0,
    planId,
    credits: plan.credits,
    isUnlimited: plan.credits === -1
  };
  
  // For subscriptions, set expiry
  if (plan.mode === 'subscription') {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    license.subscriptionExpiry = expiry.toISOString();
  }
  
  licenses[license.key] = license;
  saveLicenses(licenses);
  
  return license;
}

export function validateLicense(key: string): License | null {
  const licenses = getLicenses();
  return licenses[key] || null;
}

export function incrementDownload(key: string): boolean {
  const licenses = getLicenses();
  if (!licenses[key]) return false;
  
  licenses[key].downloadCount += 1;
  saveLicenses(licenses);
  return true;
}

export async function createCheckoutSession(successUrl: string, cancelUrl: string, planId: string = 'pro') {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const plan = PRICING_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          ...(plan.mode === 'subscription' && { recurring: { interval: plan.interval || 'month' } })
        },
        quantity: 1,
      },
    ],
    mode: plan.mode,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      product: 'promogen-license',
      planId
    }
  };

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return session;
}

export async function handleWebhook(payload: Buffer, signature: string, webhookSecret: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || 'unknown@email.com';
    const planId = session.metadata?.planId || 'pro';
    
    // Create license for the customer
    const license = createLicense(email, session.id, planId);
    return { type: 'purchase_complete', license, planId };
  }
  
  // Handle subscription events
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    // Handle subscription cancellation/changes
    return { type: event.type };
  }
  
  return { type: event.type };
}
