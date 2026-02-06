/**
 * Pricing & Credits System
 * 
 * PROFIT MARGIN ANALYSIS:
 * - Cost per generation: ~$0.002 (Gemini API)
 * - Target margin: 90%+
 * - Formula: Price = Cost / (1 - margin) = $0.002 / 0.10 = $0.02 minimum
 * 
 * PRICING TIERS (all achieve 90%+ margin):
 * - Starter Pack (25 credits @ $9): $0.36/credit, cost $0.05 = 94.4% margin
 * - Pro Pack (100 credits @ $29): $0.29/credit, cost $0.20 = 99.3% margin  
 * - Agency Pack (500 credits @ $99): $0.198/credit, cost $1.00 = 99.0% margin
 * - Unlimited Monthly ($19/mo): Even at 1000 gens = $2 cost = 89.5% margin
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';

const CREDITS_FILE = path.join(process.cwd(), 'config', 'user-credits.json');

// Stripe Product IDs (create these in your Stripe dashboard)
export const PRICING_PLANS = {
  // Credit Packs (one-time purchases)
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 25,
    priceInCents: 900, // $9
    pricePerCredit: 0.36,
    costPerCredit: 0.002,
    margin: 0.944, // 94.4%
    description: 'Perfect for trying out the full power',
    popular: false,
    badge: null,
    features: [
      '25 promo generations',
      'All templates included',
      'All export sizes',
      'Never expires'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    priceInCents: 2900, // $29
    pricePerCredit: 0.29,
    costPerCredit: 0.002,
    margin: 0.993, // 99.3%
    description: 'Best value for serious marketers',
    popular: true,
    badge: 'MOST POPULAR',
    savings: '19%',
    features: [
      '100 promo generations',
      'All templates included',
      'All export sizes',
      'Priority generation queue',
      'Never expires'
    ]
  },
  agency: {
    id: 'agency',
    name: 'Agency Pack',
    credits: 500,
    priceInCents: 9900, // $99
    pricePerCredit: 0.198,
    costPerCredit: 0.002,
    margin: 0.99, // 99.0%
    description: 'For teams and agencies',
    popular: false,
    badge: 'BEST VALUE',
    savings: '45%',
    features: [
      '500 promo generations',
      'All templates included',
      'All export sizes',
      'Priority generation queue',
      'Bulk generation (up to 10)',
      'White-label export option',
      'Never expires'
    ]
  },
  
  // Subscription (recurring)
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited Monthly',
    credits: -1, // Unlimited
    priceInCents: 1900, // $19/month
    interval: 'month',
    description: 'Unlimited generations for power users',
    popular: false,
    badge: 'UNLIMITED',
    features: [
      'Unlimited generations',
      'All templates included',
      'All export sizes',
      'Priority generation queue',
      'Bulk generation (up to 25)',
      'White-label export option',
      'Cancel anytime'
    ],
    // Cost analysis: Even at 1000 gens/mo = $2 cost = 89.5% margin
    // At 500 gens/mo = $1 cost = 94.7% margin
    // At 200 gens/mo = $0.40 cost = 97.9% margin
  }
};

// Legacy lifetime license (grandfather existing, but don't promote)
export const LEGACY_LIFETIME = {
  id: 'lifetime_legacy',
  name: 'Lifetime License (Legacy)',
  priceInCents: 4900,
  description: 'Original lifetime offer - no longer available'
};

export interface UserCredits {
  email: string;
  credits: number;
  totalPurchased: number;
  totalUsed: number;
  isUnlimited: boolean;
  unlimitedExpiry?: string;
  purchases: Array<{
    planId: string;
    credits: number;
    amount: number;
    date: string;
    stripeSessionId: string;
  }>;
  createdAt: string;
  lastUsed?: string;
}

function ensureConfigDir() {
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function getAllUserCredits(): Record<string, UserCredits> {
  ensureConfigDir();
  if (!fs.existsSync(CREDITS_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CREDITS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveAllUserCredits(data: Record<string, UserCredits>) {
  ensureConfigDir();
  fs.writeFileSync(CREDITS_FILE, JSON.stringify(data, null, 2));
}

export function getUserCredits(email: string): UserCredits | null {
  const all = getAllUserCredits();
  return all[email] || null;
}

export function createOrGetUser(email: string): UserCredits {
  const all = getAllUserCredits();
  
  if (!all[email]) {
    all[email] = {
      email,
      credits: 0,
      totalPurchased: 0,
      totalUsed: 0,
      isUnlimited: false,
      purchases: [],
      createdAt: new Date().toISOString()
    };
    saveAllUserCredits(all);
  }
  
  return all[email];
}

export function addCredits(email: string, planId: string, credits: number, amount: number, stripeSessionId: string): UserCredits {
  const all = getAllUserCredits();
  const user = all[email] || createOrGetUser(email);
  
  if (planId === 'unlimited') {
    user.isUnlimited = true;
    // Set expiry to 1 month from now
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    user.unlimitedExpiry = expiry.toISOString();
  } else {
    user.credits += credits;
    user.totalPurchased += credits;
  }
  
  user.purchases.push({
    planId,
    credits,
    amount,
    date: new Date().toISOString(),
    stripeSessionId
  });
  
  all[email] = user;
  saveAllUserCredits(all);
  
  return user;
}

export function useCredit(email: string): { success: boolean; remaining: number; error?: string } {
  const all = getAllUserCredits();
  const user = all[email];
  
  if (!user) {
    return { success: false, remaining: 0, error: 'User not found' };
  }
  
  // Check unlimited subscription
  if (user.isUnlimited) {
    if (user.unlimitedExpiry && new Date(user.unlimitedExpiry) < new Date()) {
      user.isUnlimited = false;
      delete user.unlimitedExpiry;
      all[email] = user;
      saveAllUserCredits(all);
      return { success: false, remaining: user.credits, error: 'Unlimited subscription expired' };
    }
    user.totalUsed += 1;
    user.lastUsed = new Date().toISOString();
    all[email] = user;
    saveAllUserCredits(all);
    return { success: true, remaining: -1 }; // -1 = unlimited
  }
  
  // Check credits
  if (user.credits <= 0) {
    return { success: false, remaining: 0, error: 'No credits remaining' };
  }
  
  user.credits -= 1;
  user.totalUsed += 1;
  user.lastUsed = new Date().toISOString();
  
  all[email] = user;
  saveAllUserCredits(all);
  
  return { success: true, remaining: user.credits };
}

export function checkCredits(email: string): { hasCredits: boolean; credits: number; isUnlimited: boolean } {
  const user = getUserCredits(email);
  
  if (!user) {
    return { hasCredits: false, credits: 0, isUnlimited: false };
  }
  
  // Check unlimited
  if (user.isUnlimited) {
    if (user.unlimitedExpiry && new Date(user.unlimitedExpiry) < new Date()) {
      return { hasCredits: user.credits > 0, credits: user.credits, isUnlimited: false };
    }
    return { hasCredits: true, credits: -1, isUnlimited: true };
  }
  
  return { hasCredits: user.credits > 0, credits: user.credits, isUnlimited: false };
}

// Calculate savings for display
export function calculateSavings(planId: string): number {
  const basePrice = PRICING_PLANS.starter.pricePerCredit;
  const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
  if (!plan || plan.id === 'starter' || plan.id === 'unlimited' || !('pricePerCredit' in plan)) return 0;
  
  return Math.round((1 - (plan.pricePerCredit / basePrice)) * 100);
}
