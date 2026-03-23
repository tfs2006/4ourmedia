/**
 * Pricing & Credits System
 * 
 * Margin model now targets at least 80% gross margin on every feature,
 * including higher-cost Veo video renders.
 */

import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { ACTIVE_PLAN_IDS, ACTIVE_PRICING_PLANS } from '../lib/pricing';

const CREDITS_FILE = path.join(process.cwd(), 'config', 'user-credits.json');

export const PRICING_PLANS = Object.fromEntries(
  ACTIVE_PLAN_IDS.map((planId) => {
    const plan = ACTIVE_PRICING_PLANS[planId];
    return [planId, {
      ...plan,
      pricePerCredit: plan.priceInCents / 100 / plan.credits,
    }];
  })
);

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
  
  user.credits += credits;
  user.totalPurchased += credits;
  
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

export function useCredit(email: string, amount = 1): { success: boolean; remaining: number; error?: string } {
  const all = getAllUserCredits();
  const user = all[email];
  
  if (!user) {
    return { success: false, remaining: 0, error: 'User not found' };
  }
  
  // Check credits
  if (user.credits < amount) {
    return { success: false, remaining: 0, error: 'No credits remaining' };
  }
  
  user.credits -= amount;
  user.totalUsed += amount;
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
  
  return { hasCredits: user.credits > 0, credits: user.credits, isUnlimited: false };
}

// Calculate savings for display
export function calculateSavings(planId: string): number {
  const basePrice = (PRICING_PLANS as any).starter.pricePerCredit;
  const plan = (PRICING_PLANS as any)[planId];
  if (!plan || plan.id === 'starter' || !('pricePerCredit' in plan)) return 0;
  
  return Math.round((1 - (plan.pricePerCredit / basePrice)) * 100);
}
