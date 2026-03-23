import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DEMO_FILE = path.join(process.cwd(), 'config', 'demo-usage.json');
const DAILY_LIMIT_FILE = path.join(process.cwd(), 'config', 'daily-limit.json');

export interface DemoUsage {
  sessionId: string;
  generationsUsed: number;
  lastUsed: string;
  ipAddress?: string;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalGenerations: number;
  totalAnalyses: number;
  estimatedCostCents: number;
}

export interface DemoConfig {
  enabled: boolean;
  maxGenerations: number;
  demoApiKey: string; // Your API key for demo users
  // Global daily limits to cap costs
  maxDailyGenerations: number; // Total across ALL users
  maxDailyCostCents: number; // Max cost in cents per day
}

// Demo configuration - edit these values
// Cost estimates for Gemini 2.0 Flash:
// - Analysis: ~$0.0001 per call (1K tokens)
// - Image Gen: ~$0.0015 per call
// - Total per generation: ~$0.002
// To stay under $0.01/day = 5 generations max
export const DEMO_CONFIG: DemoConfig = {
  enabled: true,
  maxGenerations: 3, // Free generations PER USER before requiring purchase
  demoApiKey: process.env.DEMO_API_KEY || '', // Set this in environment
  maxDailyGenerations: 5, // GLOBAL limit - 5 total generations per day across ALL users
  maxDailyCostCents: 1 // $0.01 max per day
};

// Cost per operation in cents (estimated for Gemini 2.0 Flash)
const COST_PER_ANALYSIS_CENTS = 0.01; // ~$0.0001
const COST_PER_IMAGE_GEN_CENTS = 0.15; // ~$0.0015
const COST_PER_GENERATION_CENTS = COST_PER_ANALYSIS_CENTS + COST_PER_IMAGE_GEN_CENTS; // ~$0.0016

function ensureConfigDir() {
  const configDir = path.join(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// ============ DAILY GLOBAL LIMIT TRACKING ============

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getDailyUsage(): DailyUsage {
  ensureConfigDir();
  const today = getTodayDate();
  
  if (!fs.existsSync(DAILY_LIMIT_FILE)) {
    return { date: today, totalGenerations: 0, totalAnalyses: 0, estimatedCostCents: 0 };
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(DAILY_LIMIT_FILE, 'utf-8')) as DailyUsage;
    // Reset if it's a new day
    if (data.date !== today) {
      return { date: today, totalGenerations: 0, totalAnalyses: 0, estimatedCostCents: 0 };
    }
    return data;
  } catch {
    return { date: today, totalGenerations: 0, totalAnalyses: 0, estimatedCostCents: 0 };
  }
}

function saveDailyUsage(usage: DailyUsage) {
  ensureConfigDir();
  fs.writeFileSync(DAILY_LIMIT_FILE, JSON.stringify(usage, null, 2));
}

export function incrementDailyUsage(type: 'analysis' | 'generation'): DailyUsage {
  const usage = getDailyUsage();
  
  if (type === 'analysis') {
    usage.totalAnalyses += 1;
    usage.estimatedCostCents += COST_PER_ANALYSIS_CENTS;
  } else {
    usage.totalGenerations += 1;
    usage.estimatedCostCents += COST_PER_IMAGE_GEN_CENTS;
  }
  
  saveDailyUsage(usage);
  return usage;
}

export function checkDailyLimit(): { allowed: boolean; reason?: string; usage: DailyUsage } {
  const usage = getDailyUsage();
  
  // Check generation count limit
  if (usage.totalGenerations >= DEMO_CONFIG.maxDailyGenerations) {
    return {
      allowed: false,
      reason: 'Daily demo limit reached. Please try again tomorrow or purchase credits to continue.',
      usage
    };
  }
  
  // Check cost limit
  if (usage.estimatedCostCents >= DEMO_CONFIG.maxDailyCostCents) {
    return {
      allowed: false,
      reason: 'Daily demo limit reached. Please try again tomorrow or purchase credits to continue.',
      usage
    };
  }
  
  return { allowed: true, usage };
}

export function getDailyLimitStatus(): { 
  generationsUsed: number; 
  generationsRemaining: number;
  estimatedCostCents: number;
  limitReached: boolean;
} {
  const usage = getDailyUsage();
  const remaining = Math.max(0, DEMO_CONFIG.maxDailyGenerations - usage.totalGenerations);
  
  return {
    generationsUsed: usage.totalGenerations,
    generationsRemaining: remaining,
    estimatedCostCents: usage.estimatedCostCents,
    limitReached: remaining === 0 || usage.estimatedCostCents >= DEMO_CONFIG.maxDailyCostCents
  };
}

// ============ PER-USER SESSION TRACKING ============

function getAllDemoUsage(): Record<string, DemoUsage> {
  ensureConfigDir();
  if (!fs.existsSync(DEMO_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(DEMO_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveDemoUsage(usage: Record<string, DemoUsage>) {
  ensureConfigDir();
  fs.writeFileSync(DEMO_FILE, JSON.stringify(usage, null, 2));
}

export function getDemoUsage(sessionId: string): DemoUsage {
  const all = getAllDemoUsage();
  return all[sessionId] || {
    sessionId,
    generationsUsed: 0,
    lastUsed: new Date().toISOString()
  };
}

export function incrementDemoUsage(sessionId: string, ipAddress?: string): DemoUsage {
  const all = getAllDemoUsage();
  const current = all[sessionId] || {
    sessionId,
    generationsUsed: 0,
    lastUsed: new Date().toISOString()
  };
  
  current.generationsUsed += 1;
  current.lastUsed = new Date().toISOString();
  if (ipAddress) current.ipAddress = ipAddress;
  
  all[sessionId] = current;
  saveDemoUsage(all);
  
  return current;
}

export function canUseDemo(sessionId: string): { allowed: boolean; remaining: number } {
  const usage = getDemoUsage(sessionId);
  const remaining = Math.max(0, DEMO_CONFIG.maxGenerations - usage.generationsUsed);
  return {
    allowed: remaining > 0,
    remaining
  };
}

export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}
