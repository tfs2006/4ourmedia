import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FEATURE_PRICING } from '../lib/pricing';
import { consumeUserCredits, refundUserCredits, verifyAuthenticatedUser } from '../lib/serverBilling';
import { logUsageTelemetry } from '../lib/usageTelemetry';
import { generateVideoAsset } from '../lib/videoGeneration';

function getClientIP(req: any): string {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || 'unknown';
}

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

  entry.count += 1;
  return { allowed: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id, x-user-id, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (process.env.API_KILL_SWITCH === 'true') {
    return res.status(503).json({ error: 'Service temporarily disabled for maintenance.' });
  }

  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.retryAfter));
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` });
  }

  const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Please sign in to use video generation.', requiresAuth: true });
  }

  let chargedCredits = false;

  try {
    const apiKey = process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'API key not configured', needsSetup: true });
    }

    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['veo-video'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'generate-video',
        ipAddress: ip,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'veo-video',
        source: 'vercel-api',
        metadata: { failureReason: 'insufficient_credits' },
      });
      return res.status(402).json({
        error: 'Not enough credits for a Veo render. Purchase more credits to continue.',
        insufficientCredits: true,
        remainingCredits: charge.remaining,
      });
    }
    chargedCredits = true;

    const video = await generateVideoAsset(apiKey, req.body);
    await logUsageTelemetry({
      endpoint: 'generate-video',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'veo-video',
      creditsCharged: FEATURE_PRICING['veo-video'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'vercel-api',
      metadata: { mode: req.body?.mode || null },
    });
    return res.json({ ...video, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Video generation error:', error);
    if (chargedCredits && authenticatedUser) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['veo-video'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'generate-video',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: false,
      featureId: 'veo-video',
      refunded: chargedCredits,
      source: 'vercel-api',
      metadata: { failureReason: error.message || 'video_generation_failed' },
    });
    return res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
}