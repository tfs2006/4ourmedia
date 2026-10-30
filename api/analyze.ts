import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { generatePromoAnalysis } from '../lib/promoPipelineRuntime.js';
import { FEATURE_PRICING } from '../lib/pricingRuntime.js';
import { consumeUserCredits, refundUserCredits, verifyAuthenticatedUser, getSupabaseAdmin } from '../lib/serverBillingRuntime.js';
import { logUsageTelemetry } from '../lib/usageTelemetryRuntime.js';
import { scoreTitle } from '../lib/titleScorerRuntime.js';
import { auditUpload } from '../lib/uploadAuditRuntime.js';
import type { PromoConversionPreset, SocialPlatform } from '../types';

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

async function handleScoreTitle(
  req: VercelRequest,
  res: VercelResponse,
  authenticatedUser: { id: string },
  ip: string
) {
  let chargedCredits = false;
  const creditsRequired = FEATURE_PRICING['title-score'].creditsRequired;
  try {
    const { title } = req.body as { title?: string };
    const cleanTitle = (title || '').trim();
    if (!cleanTitle) {
      return res.status(400).json({ error: 'A title is required.' });
    }
    if (cleanTitle.length > 200) {
      return res.status(400).json({ error: 'Keep the title under 200 characters.' });
    }

    const charge = await consumeUserCredits(authenticatedUser.id, creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'title-scorer',
        ipAddress: ip,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'title-score',
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

    const result = scoreTitle(cleanTitle);

    await logUsageTelemetry({
      endpoint: 'title-scorer',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'title-score',
      creditsCharged: creditsRequired,
      remainingCredits: charge.remaining,
      source: 'vercel-api',
      metadata: { titleLength: cleanTitle.length, score: result.score },
    });

    return res.json({ ...result, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Title scorer error:', error);
    if (chargedCredits) {
      await refundUserCredits(authenticatedUser.id, creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'title-scorer',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: false,
      featureId: 'title-score',
      refunded: chargedCredits,
      source: 'vercel-api',
      metadata: { failureReason: error.message || 'score_failed' },
    });
    return res.status(500).json({ error: error.message || 'Failed to score title' });
  }
}

// Shared credit gate for the deterministic creator tools. Returns the charge
// record, or sends a 402 and returns null when the user cannot pay.
async function chargeCredits(
  req: VercelRequest,
  res: VercelResponse,
  authenticatedUser: { id: string },
  ip: string,
  featureId: string,
  endpoint: string,
) {
  const creditsRequired = (FEATURE_PRICING as Record<string, { creditsRequired: number }>)[featureId].creditsRequired;
  const charge = await consumeUserCredits(authenticatedUser.id, creditsRequired);
  if (!charge.success) {
    await logUsageTelemetry({
      endpoint,
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: false,
      featureId,
      source: 'vercel-api',
      metadata: { failureReason: 'insufficient_credits' },
    });
    res.status(402).json({
      error: 'Not enough credits. Purchase more credits to continue.',
      insufficientCredits: true,
      remainingCredits: charge.remaining,
    });
    return null;
  }
  return { charge, creditsRequired };
}

async function handleAuditUpload(
  req: VercelRequest,
  res: VercelResponse,
  authenticatedUser: { id: string },
  ip: string,
) {
  let chargedCredits = false;
  const creditsRequired = (FEATURE_PRICING as Record<string, { creditsRequired: number }>)['upload-audit'].creditsRequired;
  try {
    const billed = await chargeCredits(req, res, authenticatedUser, ip, 'upload-audit', 'upload-auditor');
    if (!billed) return;
    chargedCredits = true;
    const { title, description, tags, pinned, chapters, endScreen, cards } = req.body as {
      title?: string; description?: string; tags?: string;
      pinned?: boolean; chapters?: boolean; endScreen?: boolean; cards?: boolean;
    };
    const result = auditUpload({
      title: title || '', description: description || '', tags: tags || '',
      pinned: !!pinned, chapters: !!chapters, endScreen: !!endScreen, cards: !!cards,
    });
    await logUsageTelemetry({
      endpoint: 'upload-auditor',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'upload-audit',
      creditsCharged: creditsRequired,
      remainingCredits: billed.charge.remaining,
      source: 'vercel-api',
      metadata: { verdict: result.verdict },
    });
    return res.json({ ...result, remainingCredits: billed.charge.remaining });
  } catch (error: any) {
    console.error('Upload auditor error:', error);
    if (chargedCredits) {
      await refundUserCredits(authenticatedUser.id, creditsRequired).catch(() => undefined);
    }
    return res.status(500).json({ error: error.message || 'Audit failed' });
  }
}

async function handleDeclareWinner(
  req: VercelRequest,
  res: VercelResponse,
  authenticatedUser: { id: string },
  ip: string,
) {
  let chargedCredits = false;
  const creditsRequired = (FEATURE_PRICING as Record<string, { creditsRequired: number }>)['declare-winner'].creditsRequired;
  try {
    const { video_name } = req.body as { video_name?: string };
    const videoName = (video_name || '').trim();
    if (!videoName) {
      return res.status(400).json({ error: 'Video name is required.' });
    }
    const admin = getSupabaseAdmin();
    const { data: rows, error } = await admin
      .from('title_tests')
      .select('title, ctr, impressions')
      .eq('user_id', authenticatedUser.id)
      .eq('video_name', videoName);
    if (error) {
      return res.status(500).json({ error: 'Could not read your tests. Try again.' });
    }
    const withCtr = (rows || []).filter((r: any) => r.ctr != null);
    if (withCtr.length < 2) {
      return res.status(400).json({ error: 'Log at least two title variants with CTR data for this video first.' });
    }
    const billed = await chargeCredits(req, res, authenticatedUser, ip, 'declare-winner', 'title-tracker');
    if (!billed) return;
    chargedCredits = true;
    const sorted = [...withCtr].sort((a: any, b: any) => Number(b.ctr) - Number(a.ctr));
    const winner = sorted[0];
    const minImpressions = Math.min(...withCtr.map((r: any) => Number(r.impressions) || 0));
    const significant = minImpressions >= 1000;
    const verdict = {
      winner: winner.title as string,
      winnerCtr: Number(winner.ctr),
      significant,
      reason: significant
        ? `"${winner.title}" leads at ${winner.ctr}% CTR, and every variant has enough impressions to trust it. Make it your template.`
        : `"${winner.title}" leads at ${winner.ctr}% CTR, but at least one variant is under 1,000 impressions. Keep testing before you call it.`,
    };
    await logUsageTelemetry({
      endpoint: 'title-tracker',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'declare-winner',
      creditsCharged: creditsRequired,
      remainingCredits: billed.charge.remaining,
      source: 'vercel-api',
      metadata: { videoName, significant },
    });
    return res.json({ verdict, remainingCredits: billed.charge.remaining });
  } catch (error: any) {
    console.error('Declare winner error:', error);
    if (chargedCredits) {
      await refundUserCredits(authenticatedUser.id, creditsRequired).catch(() => undefined);
    }
    return res.status(500).json({ error: error.message || 'Verdict failed' });
  }
}

async function handleUnlockHooks(
  req: VercelRequest,
  res: VercelResponse,
  authenticatedUser: { id: string },
  ip: string,
) {
  let chargedCredits = false;
  const creditsRequired = (FEATURE_PRICING as Record<string, { creditsRequired: number }>)['hook-unlock'].creditsRequired;
  try {
    const admin = getSupabaseAdmin();
    const { data: existing, error: readError } = await admin
      .from('hook_unlocks')
      .select('user_id')
      .eq('user_id', authenticatedUser.id)
      .maybeSingle();
    if (readError && (readError as any).code === '42P01') {
      return res.status(503).json({ error: 'The Hook Swipe File is finishing setup. Try again in a few minutes.' });
    }
    if (existing) {
      return res.json({ alreadyUnlocked: true });
    }
    const billed = await chargeCredits(req, res, authenticatedUser, ip, 'hook-unlock', 'hook-library');
    if (!billed) return;
    chargedCredits = true;
    const { error: insertError } = await admin
      .from('hook_unlocks')
      .insert({ user_id: authenticatedUser.id });
    if (insertError) {
      if ((insertError as any).code === '42P01') {
        await refundUserCredits(authenticatedUser.id, creditsRequired).catch(() => undefined);
        return res.status(503).json({ error: 'The Hook Swipe File is finishing setup. Try again in a few minutes.' });
      }
      throw insertError;
    }
    await logUsageTelemetry({
      endpoint: 'hook-library',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'hook-unlock',
      creditsCharged: creditsRequired,
      remainingCredits: billed.charge.remaining,
      source: 'vercel-api',
      metadata: {},
    });
    return res.json({ unlocked: true, remainingCredits: billed.charge.remaining });
  } catch (error: any) {
    console.error('Hook unlock error:', error);
    if (chargedCredits) {
      await refundUserCredits(authenticatedUser.id, creditsRequired).catch(() => undefined);
    }
    return res.status(500).json({ error: error.message || 'Unlock failed' });
  }
}

async function handleThumbnailCheck(
  req: VercelRequest,
  res: VercelResponse,
  authenticatedUser: { id: string },
  ip: string,
) {
  let chargedCredits = false;
  const creditsRequired = (FEATURE_PRICING as Record<string, { creditsRequired: number }>)['thumbnail-check'].creditsRequired;
  try {
    // The image analysis runs in the browser for privacy (never uploaded).
    // This endpoint is the usage gate: it spends the credit and returns.
    const billed = await chargeCredits(req, res, authenticatedUser, ip, 'thumbnail-check', 'thumbnail-checker');
    if (!billed) return;
    chargedCredits = true;
    await logUsageTelemetry({
      endpoint: 'thumbnail-checker',
      ipAddress: ip,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'thumbnail-check',
      creditsCharged: creditsRequired,
      remainingCredits: billed.charge.remaining,
      source: 'vercel-api',
      metadata: {},
    });
    return res.json({ ok: true, remainingCredits: billed.charge.remaining });
  } catch (error: any) {
    console.error('Thumbnail check error:', error);
    if (chargedCredits) {
      await refundUserCredits(authenticatedUser.id, creditsRequired).catch(() => undefined);
    }
    return res.status(500).json({ error: error.message || 'Check failed' });
  }
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

  // Viral Title Scorer op. Deterministic, no AI key needed. 1 credit per score.
  const op = typeof req.query.op === 'string' ? req.query.op : undefined;
  if (op === 'score-title') {
    return handleScoreTitle(req, res, authenticatedUser, ip);
  }
  if (op === 'audit-upload') {
    return handleAuditUpload(req, res, authenticatedUser, ip);
  }
  if (op === 'declare-winner') {
    return handleDeclareWinner(req, res, authenticatedUser, ip);
  }
  if (op === 'unlock-hooks') {
    return handleUnlockHooks(req, res, authenticatedUser, ip);
  }
  if (op === 'thumbnail-check') {
    return handleThumbnailCheck(req, res, authenticatedUser, ip);
  }

  let chargedCredits = false;

  try {
    const { url, platform = 'instagram', conversionPreset = 'auto' } = req.body as {
      url?: string;
      platform?: SocialPlatform;
      conversionPreset?: PromoConversionPreset;
    };
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const validPlatforms = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube'];
    const safePlatform = validPlatforms.includes(platform) ? platform : 'instagram';
    const safePreset: PromoConversionPreset = ['auto', 'fomo', 'social-proof', 'premium-authority', 'problem-solution'].includes(conversionPreset)
      ? conversionPreset
      : 'auto';

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
    const cacheKey = `${url}::${safePlatform}::${safePreset}`;
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
        metadata: { platform: safePlatform, conversionPreset: safePreset, cacheHit: true },
      });
      return res.json({ ...cached, remainingCredits: charge.remaining });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await withTimeout(
      generatePromoAnalysis(ai, url, safePlatform, safePreset),
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
      metadata: { platform: safePlatform, conversionPreset: safePreset, cacheHit: false },
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
