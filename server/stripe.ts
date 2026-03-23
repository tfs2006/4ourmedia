import Stripe from 'stripe';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ACTIVE_PLAN_IDS, ACTIVE_PRICING_PLANS } from '../lib/pricing';

// Initialize Stripe - set your secret key in environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

export const PRICING_PLANS = Object.fromEntries(
  ACTIVE_PLAN_IDS.map((planId) => {
    const plan = ACTIVE_PRICING_PLANS[planId];
    return [planId, {
      name: `4ourMedia PromoGen - ${plan.name}`,
      description: `${plan.credits} credits. Never expires.`,
      priceInCents: plan.priceInCents,
      credits: plan.credits,
      mode: 'payment' as const,
    }];
  })
) as Record<string, {
  name: string;
  description: string;
  priceInCents: number;
  credits: number;
  mode: 'payment';
}>;

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
    isUnlimited: false
  };
  
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
  
  return { type: event.type };
}
