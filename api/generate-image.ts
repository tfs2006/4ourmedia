import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { generatePromoImage } from '../lib/promoPipelineRuntime.js';
import { FEATURE_PRICING } from '../lib/pricing';
import { consumeUserCredits, refundUserCredits, verifyAuthenticatedUser } from '../lib/serverBilling';
import { logUsageTelemetry } from '../lib/usageTelemetry';
import type { SocialPlatform } from '../types';

// Session tracking for demo limits (backup - Supabase is primary)
const sessionUsage = new Map<string, { generationsUsed: number }>();
const MAX_DEMO_GENERATIONS = 3;
const IMAGE_TIMEOUT_MS = 55000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
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

  const sessionId = req.headers['x-session-id'] as string;
  const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);

  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Please sign in to generate promos.', requiresAuth: true });
  }

  let chargedCredits = false;

  try {
    const { imagePrompt, emotionalTrigger, colors, productCategory, platform, visualStyle } = req.body as {
      imagePrompt?: string;
      emotionalTrigger?: string;
      colors?: string[];
      productCategory?: string;
      platform?: SocialPlatform;
      visualStyle?: string;
    };

    if (!imagePrompt) {
      return res.status(400).json({ error: 'imagePrompt is required' });
    }

    // Check per-session limit in demo mode (backup check)
    if (process.env.DEMO_MODE === 'true' && sessionId) {
      const usage = sessionUsage.get(sessionId) || { generationsUsed: 0 };
      if (usage.generationsUsed >= MAX_DEMO_GENERATIONS) {
        return res.status(403).json({ 
          error: 'Demo limit reached. Purchase credits to continue.',
          demoLimitReached: true,
          remaining: 0
        });
      }
    }

    const apiKey = process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'API key not configured', needsSetup: true });
    }

    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['promo-generation'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'generate-image',
        ipAddress: ip,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'promo-generation',
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

    const ai = new GoogleGenAI({ apiKey });
    const base64Data = await withTimeout(
      generatePromoImage(ai, {
        imagePrompt,
        emotionalTrigger,
        colors,
        productCategory,
        platform,
        visualStyle,
      }),
      IMAGE_TIMEOUT_MS,
      'Image generation timed out on the server. Please retry.'
    );

    // Track usage in memory (backup)
    let demoStatus = null;
    if (process.env.DEMO_MODE === 'true' && sessionId) {
      const usage = sessionUsage.get(sessionId) || { generationsUsed: 0 };
      usage.generationsUsed += 1;
      sessionUsage.set(sessionId, usage);
      demoStatus = {
        generationsUsed: usage.generationsUsed,
        remaining: Math.max(0, MAX_DEMO_GENERATIONS - usage.generationsUsed)
      };
    }

    await logUsageTelemetry({
      endpoint: 'generate-image',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'promo-generation',
      creditsCharged: FEATURE_PRICING['promo-generation'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'vercel-api',
      metadata: { mode: 'standalone-image' },
    });

    res.json({ imageBase64: base64Data, demoStatus, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Image generation error:', error);
    if (chargedCredits && authenticatedUser) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['promo-generation'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'generate-image',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: false,
      featureId: 'promo-generation',
      refunded: chargedCredits,
      source: 'vercel-api',
      metadata: { failureReason: error.message || 'image_generation_failed' },
    });
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
