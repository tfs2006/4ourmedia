import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://4ourmedia.com',
  'https://www.4ourmedia.com',
  'https://4ourmedia-promogen.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

const GLOBAL_MONTHLY_LIMIT = parseInt(process.env.API_MONTHLY_LIMIT || '10000', 10);
const GLOBAL_DAILY_LIMIT = parseInt(process.env.API_DAILY_LIMIT || '500', 10);
const IP_RATE_LIMIT_MAX = parseInt(process.env.IP_RATE_LIMIT || '10', 10);
const USER_RATE_LIMIT_MAX = parseInt(process.env.USER_RATE_LIMIT || '20', 10);

type AdminIdentity = {
  id: string;
  email?: string;
};

function parseCsvEnv(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getConfiguredAdminUserIds() {
  return parseCsvEnv(process.env.ADMIN_USER_IDS);
}

function getConfiguredAdminEmails() {
  return parseCsvEnv(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase());
}

function hasConfiguredAdminAllowlist() {
  return getConfiguredAdminUserIds().length > 0 || getConfiguredAdminEmails().length > 0;
}

function isAuthorizedAdmin(user: AdminIdentity | null) {
  if (!user) {
    return false;
  }

  const allowedIds = getConfiguredAdminUserIds();
  const allowedEmails = getConfiguredAdminEmails();

  if (allowedIds.length === 0 && allowedEmails.length === 0) {
    return false;
  }

  if (allowedIds.includes(user.id)) {
    return true;
  }

  if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  return false;
}

function isAllowedOrigin(origin: string | undefined) {
  if (!origin) return false;
  if (process.env.NODE_ENV === 'development') return true;
  return ALLOWED_ORIGINS.some((allowed) => origin === allowed || origin.endsWith('.vercel.app'));
}

function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': process.env.STRICT_CORS === 'true' ? allowedOrigin : '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-session-id, x-user-id, x-admin-secret, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service role is not configured');
  }

  return createClient(url, serviceKey);
}

function getAuthorizationHeader(headers: Record<string, any>) {
  const rawHeader = headers.authorization || headers.Authorization;
  if (Array.isArray(rawHeader)) {
    return rawHeader[0] || '';
  }
  return rawHeader || '';
}

async function verifyAuthenticatedUser(headers: Record<string, any>): Promise<AdminIdentity | null> {
  const authorization = getAuthorizationHeader(headers);
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email || undefined,
  };
}

function getLegacyEstimatedCost(endpoint: string) {
  if (endpoint === 'analyze') return 0.001;
  if (endpoint === 'generate-image' || endpoint === 'generate-promo') return 0.01;
  if (endpoint === 'generate-video') return 0.06;
  return 0;
}

async function getAdminStats() {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ count: dailyCalls }, { count: monthlyCalls }, usageResult] = await Promise.all([
    supabase.from('api_usage').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
    supabase.from('api_usage').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('api_usage').select('endpoint, success, metadata').gte('created_at', startOfMonth),
  ]);

  const costData = usageResult.data || [];
  let estimatedCost = 0;
  let estimatedRevenue = 0;
  let totalCreditsCharged = 0;
  const endpointStats = new Map<string, {
    endpoint: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    creditsCharged: number;
    estimatedCost: number;
    estimatedRevenue: number;
    estimatedProfit: number;
  }>();
  const presetStats = new Map<string, {
    preset: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    creditsCharged: number;
    estimatedCost: number;
    estimatedRevenue: number;
    estimatedProfit: number;
    endpoints: Set<string>;
  }>();

  for (const row of costData) {
    const metadata = typeof row.metadata === 'object' && row.metadata ? row.metadata as Record<string, any> : {};
    const rowCost = typeof metadata.estimatedCostUsd === 'number'
      ? metadata.estimatedCostUsd
      : getLegacyEstimatedCost(row.endpoint);
    const rowRevenue = typeof metadata.estimatedRevenueUsd === 'number'
      ? metadata.estimatedRevenueUsd
      : 0;
    const rowCredits = typeof metadata.creditsCharged === 'number'
      ? metadata.creditsCharged
      : 0;
    const rowPreset = typeof metadata.conversionPreset === 'string'
      ? metadata.conversionPreset.trim()
      : '';

    estimatedCost += rowCost;
    estimatedRevenue += rowRevenue;
    totalCreditsCharged += rowCredits;

    const current = endpointStats.get(row.endpoint) || {
      endpoint: row.endpoint,
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      creditsCharged: 0,
      estimatedCost: 0,
      estimatedRevenue: 0,
      estimatedProfit: 0,
    };

    current.totalCalls += 1;
    if (row.success) current.successfulCalls += 1;
    else current.failedCalls += 1;
    current.creditsCharged += rowCredits;
    current.estimatedCost += rowCost;
    current.estimatedRevenue += rowRevenue;
    current.estimatedProfit = current.estimatedRevenue - current.estimatedCost;
    endpointStats.set(row.endpoint, current);

    if (rowPreset) {
      const presetCurrent = presetStats.get(rowPreset) || {
        preset: rowPreset,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        creditsCharged: 0,
        estimatedCost: 0,
        estimatedRevenue: 0,
        estimatedProfit: 0,
        endpoints: new Set<string>(),
      };

      presetCurrent.totalCalls += 1;
      if (row.success) presetCurrent.successfulCalls += 1;
      else presetCurrent.failedCalls += 1;
      presetCurrent.creditsCharged += rowCredits;
      presetCurrent.estimatedCost += rowCost;
      presetCurrent.estimatedRevenue += rowRevenue;
      presetCurrent.estimatedProfit = presetCurrent.estimatedRevenue - presetCurrent.estimatedCost;
      presetCurrent.endpoints.add(row.endpoint);
      presetStats.set(rowPreset, presetCurrent);
    }
  }

  const byEndpoint = Array.from(endpointStats.values())
    .sort((left, right) => right.estimatedRevenue - left.estimatedRevenue)
    .map((entry) => ({
      ...entry,
      estimatedMargin: entry.estimatedRevenue > 0 ? entry.estimatedProfit / entry.estimatedRevenue : null,
    }));

  const byPreset = Array.from(presetStats.values())
    .sort((left, right) => right.estimatedRevenue - left.estimatedRevenue)
    .map((entry) => ({
      preset: entry.preset,
      totalCalls: entry.totalCalls,
      successfulCalls: entry.successfulCalls,
      failedCalls: entry.failedCalls,
      successRate: entry.totalCalls > 0 ? entry.successfulCalls / entry.totalCalls : null,
      creditsCharged: entry.creditsCharged,
      estimatedCost: entry.estimatedCost,
      estimatedRevenue: entry.estimatedRevenue,
      estimatedProfit: entry.estimatedProfit,
      estimatedMargin: entry.estimatedRevenue > 0 ? entry.estimatedProfit / entry.estimatedRevenue : null,
      endpointCount: entry.endpoints.size,
      endpoints: Array.from(entry.endpoints).sort(),
    }));

  const estimatedProfit = estimatedRevenue - estimatedCost;

  return {
    usage: {
      dailyCalls: dailyCalls || 0,
      monthlyCalls: monthlyCalls || 0,
      estimatedCost,
      estimatedRevenue,
      estimatedProfit,
      estimatedMargin: estimatedRevenue > 0 ? estimatedProfit / estimatedRevenue : null,
      totalCreditsCharged,
      limitReached: (monthlyCalls || 0) >= GLOBAL_MONTHLY_LIMIT || (dailyCalls || 0) >= GLOBAL_DAILY_LIMIT,
      byEndpoint,
      byPreset,
    },
    limits: {
      globalMonthly: GLOBAL_MONTHLY_LIMIT,
      globalDaily: GLOBAL_DAILY_LIMIT,
      ipPerMinute: IP_RATE_LIMIT_MAX,
      userPerMinute: USER_RATE_LIMIT_MAX,
    },
    killSwitch: process.env.API_KILL_SWITCH === 'true',
    strictCors: process.env.STRICT_CORS === 'true',
  };
}

/**
 * Admin endpoint to check API usage stats
 * Protected by admin secret + authenticated allowlisted admin user
 *
 * Required env: ADMIN_SECRET plus ADMIN_EMAILS or ADMIN_USER_IDS
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  const corsHeaders = getCorsHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = req.query.secret || req.headers['x-admin-secret'];

  if (!adminSecret || providedSecret !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!hasConfiguredAdminAllowlist()) {
    return res.status(503).json({ error: 'Admin allowlist is not configured. Set ADMIN_EMAILS or ADMIN_USER_IDS.' });
  }

  try {
    const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Sign in required for admin access.' });
    }

    if (!isAuthorizedAdmin(authenticatedUser)) {
      return res.status(403).json({ error: 'This account is not approved for admin access.' });
    }

    const stats = await getAdminStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      viewer: {
        email: authenticatedUser.email || null,
        userId: authenticatedUser.id,
      },
      ...stats,
      alertThresholds: {
        warningAt: '80% of limits',
        criticalAt: '95% of limits'
      }
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    const message = error?.message || 'Failed to fetch stats';
    if (message.includes('Supabase service role is not configured')) {
      return res.status(503).json({
        error: 'Admin backend is missing Supabase server credentials. Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or VITE_SUPABASE_URL in Vercel.',
      });
    }

    res.status(500).json({ error: message });
  }
}