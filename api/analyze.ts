import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { generatePromoAnalysis } from '../lib/promoPipeline';
import { FEATURE_PRICING } from '../lib/pricing';
import { consumeUserCredits, refundUserCredits, verifyAuthenticatedUser } from '../lib/serverBilling';
import { logUsageTelemetry } from '../lib/usageTelemetry';
import type { SocialPlatform } from '../types';

// Simple in-memory cache
const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const ANALYSIS_TIMEOUT_MS = 45000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function getCached(url: string): any | null {
  const cached = analysisCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(url: string, data: any) {
  if (analysisCache.size > 100) {
    const firstKey = analysisCache.keys().next().value;
    if (firstKey) analysisCache.delete(firstKey);
  }
  analysisCache.set(url, { data, timestamp: Date.now() });
}

// ============ Inline Safety Helpers ============
function getClientIP(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || 'unknown';
}

// Simple rate limiting (in-memory, resets on cold start)
const ipRequests = new Map<string, { count: number; resetTime: number }>();
const IP_LIMIT = parseInt(process.env.IP_RATE_LIMIT || '10');

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  
  if (!entry || now > entry.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + 60000 });
    return { allowed: true };
  }
  
  if (entry.count >= IP_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }
  
  entry.count++;
  return { allowed: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id, x-user-id, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Kill switch check
  if (process.env.API_KILL_SWITCH === 'true') {
    return res.status(503).json({ error: 'Service temporarily disabled for maintenance.' });
  }

  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.retryAfter));
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` });
  }

  const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Please sign in to use PromoGen.', requiresAuth: true });
  }

  let chargedCredits = false;

  try {
    const { url, platform = 'instagram' } = req.body as { url?: string; platform?: SocialPlatform };
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const validPlatforms = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube'];
    const safePlatform = validPlatforms.includes(platform) ? platform : 'instagram';

    const apiKey = process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'API key not configured', needsSetup: true });
    }

    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['analysis-only'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'analyze',
        ipAddress: ip,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'analysis-only',
        source: 'vercel-api',
        metadata: { failureReason: 'insufficient_credits' },
      });
      return res.status(402).json({
        error: 'Not enough credits. Purchase more credits to continue.',
        insufficientCredits: true,
        remainingCredits: charge.remaining,
      });
    }
    chargedCredits = true;

    // Check cache after charging so analysis-only access is always billed.
    const cacheKey = `${url}::${safePlatform}`;
    const cached = getCached(cacheKey);
    if (cached) {
      await logUsageTelemetry({
        endpoint: 'analyze',
        ipAddress: ip,
        userId: authenticatedUser.id,
        success: true,
        featureId: 'analysis-only',
        creditsCharged: FEATURE_PRICING['analysis-only'].creditsRequired,
        remainingCredits: charge.remaining,
        source: 'vercel-api',
        metadata: { platform: safePlatform, cacheHit: true },
      });
      return res.json({ ...cached, remainingCredits: charge.remaining });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await withTimeout(
      generatePromoAnalysis(ai, url, safePlatform),
      ANALYSIS_TIMEOUT_MS,
      'Product analysis timed out on the server. Please retry in a moment.'
    );
    setCache(cacheKey, result);

    await logUsageTelemetry({
      endpoint: 'analyze',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'analysis-only',
      creditsCharged: FEATURE_PRICING['analysis-only'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'vercel-api',
      metadata: { platform: safePlatform, cacheHit: false },
    });

    res.json({ ...result, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Analysis error:', error);
    if (chargedCredits) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['analysis-only'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'analyze',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: false,
      featureId: 'analysis-only',
      refunded: chargedCredits,
      source: 'vercel-api',
      metadata: { failureReason: error.message || 'analysis_failed' },
    });
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
}
