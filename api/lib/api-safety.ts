/**
 * API Safety & Rate Limiting Module
 * 
 * Protects against:
 * - Runaway API costs (global monthly limit)
 * - Abuse from single IPs (rate limiting)
 * - Leaked keys being exploited (auth + rate limits)
 * - Emergency situations (kill switch)
 */

import { createClient } from '@supabase/supabase-js';

// ============ Configuration ============
const ALLOWED_ORIGINS = [
  'https://4ourmedia.com',
  'https://www.4ourmedia.com',
  'https://4ourmedia-promogen.vercel.app',
  // Allow localhost for development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Limits (can be overridden by env vars)
const GLOBAL_MONTHLY_LIMIT = parseInt(process.env.API_MONTHLY_LIMIT || '10000'); // Total API calls per month
const GLOBAL_DAILY_LIMIT = parseInt(process.env.API_DAILY_LIMIT || '500'); // Total API calls per day
const IP_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const IP_RATE_LIMIT_MAX = parseInt(process.env.IP_RATE_LIMIT || '10'); // Max requests per IP per minute
const USER_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const USER_RATE_LIMIT_MAX = parseInt(process.env.USER_RATE_LIMIT || '20'); // Max requests per user per minute

// Estimated cost per API call (for budget tracking)
const COST_PER_ANALYZE = 0.001; // ~$0.001 per analyze call
const COST_PER_IMAGE = 0.01;   // ~$0.01 per image generation

// ============ In-Memory Rate Limiting ============
// Note: This resets on cold starts. For production, consider Upstash Redis.
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const ipRateLimits = new Map<string, RateLimitEntry>();
const userRateLimits = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipRateLimits.entries()) {
    if (now > entry.resetTime) ipRateLimits.delete(key);
  }
  for (const [key, entry] of userRateLimits.entries()) {
    if (now > entry.resetTime) userRateLimits.delete(key);
  }
}, 60000); // Clean every minute

// ============ Supabase Client (Service Role for backend) ============
function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    console.warn('Supabase not configured for usage tracking');
    return null;
  }
  
  return createClient(url, serviceKey);
}

// ============ Types ============
export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

export interface UsageStats {
  dailyCalls: number;
  monthlyCalls: number;
  estimatedCost: number;
  limitReached: boolean;
}

// ============ Core Safety Functions ============

/**
 * Check if API is in emergency shutdown mode
 */
export function isKillSwitchEnabled(): boolean {
  return process.env.API_KILL_SWITCH === 'true';
}

/**
 * Validate CORS origin
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  
  // In development, allow all
  if (process.env.NODE_ENV === 'development') return true;
  
  return ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.vercel.app')
  );
}

/**
 * Get client IP from Vercel request
 */
export function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Check IP rate limit
 */
export function checkIPRateLimit(ip: string): SafetyCheckResult {
  const now = Date.now();
  const entry = ipRateLimits.get(ip);
  
  if (!entry || now > entry.resetTime) {
    // New window
    ipRateLimits.set(ip, { count: 1, resetTime: now + IP_RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (entry.count >= IP_RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      reason: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      statusCode: 429,
      headers: { 'Retry-After': String(retryAfter) }
    };
  }
  
  entry.count++;
  return { allowed: true };
}

/**
 * Check user rate limit (for authenticated users)
 */
export function checkUserRateLimit(userId: string): SafetyCheckResult {
  const now = Date.now();
  const entry = userRateLimits.get(userId);
  
  if (!entry || now > entry.resetTime) {
    userRateLimits.set(userId, { count: 1, resetTime: now + USER_RATE_LIMIT_WINDOW });
    return { allowed: true };
  }
  
  if (entry.count >= USER_RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      reason: `Too many requests. Slow down! Try again in ${retryAfter} seconds.`,
      statusCode: 429,
      headers: { 'Retry-After': String(retryAfter) }
    };
  }
  
  entry.count++;
  return { allowed: true };
}

/**
 * Get current usage stats from Supabase
 */
export async function getUsageStats(): Promise<UsageStats | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // Get daily count
    const { count: dailyCalls } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay);
    
    // Get monthly count
    const { count: monthlyCalls } = await supabase
      .from('api_usage')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth);
    
    // Get monthly cost estimate
    const { data: costData } = await supabase
      .from('api_usage')
      .select('endpoint')
      .gte('created_at', startOfMonth);
    
    let estimatedCost = 0;
    if (costData) {
      for (const row of costData) {
        if (row.endpoint === 'analyze') estimatedCost += COST_PER_ANALYZE;
        else if (row.endpoint === 'generate-image') estimatedCost += COST_PER_IMAGE;
      }
    }
    
    return {
      dailyCalls: dailyCalls || 0,
      monthlyCalls: monthlyCalls || 0,
      estimatedCost,
      limitReached: (monthlyCalls || 0) >= GLOBAL_MONTHLY_LIMIT || (dailyCalls || 0) >= GLOBAL_DAILY_LIMIT
    };
  } catch (err) {
    console.error('Error fetching usage stats:', err);
    return null;
  }
}

/**
 * Check global usage limits
 */
export async function checkGlobalLimits(): Promise<SafetyCheckResult> {
  const stats = await getUsageStats();
  
  if (!stats) {
    // If we can't check, allow but log warning
    console.warn('Could not check global limits - Supabase not available');
    return { allowed: true };
  }
  
  if (stats.monthlyCalls >= GLOBAL_MONTHLY_LIMIT) {
    return {
      allowed: false,
      reason: 'Service temporarily unavailable. Monthly limit reached.',
      statusCode: 503
    };
  }
  
  if (stats.dailyCalls >= GLOBAL_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: 'Service temporarily unavailable. Daily limit reached. Try again tomorrow.',
      statusCode: 503
    };
  }
  
  return { allowed: true };
}

/**
 * Log API usage to Supabase
 */
export async function logApiUsage(
  endpoint: 'analyze' | 'generate-image',
  ip: string,
  userId?: string,
  success: boolean = true,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  
  try {
    await supabase.from('api_usage').insert({
      endpoint,
      ip_address: ip,
      user_id: userId || null,
      success,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging API usage:', err);
  }
}

/**
 * Master safety check - run all checks
 */
export async function runSafetyChecks(
  req: any,
  endpoint: 'analyze' | 'generate-image'
): Promise<SafetyCheckResult> {
  // 1. Kill switch
  if (isKillSwitchEnabled()) {
    return {
      allowed: false,
      reason: 'Service temporarily disabled for maintenance.',
      statusCode: 503
    };
  }
  
  // 2. CORS check
  const origin = req.headers.origin || req.headers.referer;
  if (process.env.STRICT_CORS === 'true' && !isAllowedOrigin(origin)) {
    return {
      allowed: false,
      reason: 'Unauthorized origin',
      statusCode: 403
    };
  }
  
  // 3. IP rate limit
  const ip = getClientIP(req);
  const ipCheck = checkIPRateLimit(ip);
  if (!ipCheck.allowed) return ipCheck;
  
  // 4. User rate limit (if authenticated)
  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    const userCheck = checkUserRateLimit(userId);
    if (!userCheck.allowed) return userCheck;
  }
  
  // 5. Global limits
  const globalCheck = await checkGlobalLimits();
  if (!globalCheck.allowed) return globalCheck;
  
  return { allowed: true };
}

/**
 * Get CORS headers based on origin
 */
export function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': process.env.STRICT_CORS === 'true' ? allowedOrigin! : '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-session-id, x-user-id, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Admin endpoint to get current usage stats
 */
export async function getAdminStats(): Promise<{
  usage: UsageStats | null;
  limits: {
    globalMonthly: number;
    globalDaily: number;
    ipPerMinute: number;
    userPerMinute: number;
  };
  killSwitch: boolean;
  strictCors: boolean;
}> {
  return {
    usage: await getUsageStats(),
    limits: {
      globalMonthly: GLOBAL_MONTHLY_LIMIT,
      globalDaily: GLOBAL_DAILY_LIMIT,
      ipPerMinute: IP_RATE_LIMIT_MAX,
      userPerMinute: USER_RATE_LIMIT_MAX
    },
    killSwitch: isKillSwitchEnabled(),
    strictCors: process.env.STRICT_CORS === 'true'
  };
}
