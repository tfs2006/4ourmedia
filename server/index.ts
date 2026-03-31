import dns from 'node:dns';
// Force IPv4 to avoid network timeouts
dns.setDefaultResultOrder('ipv4first');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { getConfig, saveConfig, isConfigured } from './config';
import { FEATURE_PRICING } from '../lib/pricing';
import { generatePromoAnalysis, generatePromoAsset, generatePromoImage } from '../lib/promoPipeline';
import { consumeUserCredits, refundUserCredits, verifyAuthenticatedUser } from '../lib/serverBilling';
import { logUsageTelemetry } from '../lib/usageTelemetry';
import { generateVideoAsset } from '../lib/videoGeneration';
import type { PromoConversionPreset, SocialPlatform } from '../types';
import {
  DEMO_CONFIG,
  canUseDemo,
  incrementDemoUsage,
  getDemoUsage,
  generateSessionId,
  checkDailyLimit,
  incrementDailyUsage,
  getDailyLimitStatus
} from './demo';
import {
  stripe,
  PRODUCT_CONFIG,
  createCheckoutSession,
  handleWebhook,
  validateLicense,
  incrementDownload,
  createLicense
} from './stripe';

const app = express();
const PORT = process.env.PORT || 3001;
const IS_DEMO_SERVER = process.env.DEMO_MODE === 'true';

// ============ Caching for API Optimization ============
interface CachedAnalysis {
  data: any;
  timestamp: number;
}
const analysisCache = new Map<string, CachedAnalysis>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

function getCachedAnalysis(url: string): any | null {
  const cached = analysisCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Cache hit for:', url);
    return cached.data;
  }
  return null;
}

function setCachedAnalysis(url: string, data: any) {
  // Limit cache size to prevent memory issues
  if (analysisCache.size > 100) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }
  analysisCache.set(url, { data, timestamp: Date.now() });
}

app.use(cors());

// Raw body parser for Stripe webhooks
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Helper to get configured AI client
function getAIClient(apiKey?: string) {
  const key = apiKey || getConfig().geminiApiKey;
  if (!key) {
    throw new Error('API key not configured');
  }
  return new GoogleGenAI({ apiKey: key });
}

// ============ Demo & Purchase Routes (for demo server only) ============

// Get demo status
app.get('/api/demo/status', (req, res) => {
  const sessionId = req.headers['x-session-id'] as string || '';

  if (!IS_DEMO_SERVER) {
    return res.json({ demoMode: false });
  }

  const demoStatus = sessionId ? canUseDemo(sessionId) : { allowed: true, remaining: DEMO_CONFIG.maxGenerations };

  res.json({
    demoMode: true,
    enabled: DEMO_CONFIG.enabled,
    maxGenerations: DEMO_CONFIG.maxGenerations,
    ...demoStatus,
    sessionId: sessionId || generateSessionId()
  });
});

// Get product info for purchase
app.get('/api/purchase/info', (_req, res) => {
  res.json({
    available: !!stripe,
    product: {
      name: PRODUCT_CONFIG.name,
      description: PRODUCT_CONFIG.description,
      price: PRODUCT_CONFIG.priceInCents / 100,
      currency: 'usd'
    }
  });
});

// Create Stripe checkout session
app.post('/api/purchase/checkout', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment system not configured' });
    }

    const { successUrl, cancelUrl, planId } = req.body;
    const session = await createCheckoutSession(
      successUrl || `${req.headers.origin}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl || `${req.headers.origin}/`,
      planId || 'pro'
    );

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });

    // Send safe error to client but log full details
    res.status(500).json({
      error: 'Payment system error',
      details: error.message // Safe to share message usually, but avoid specific account info
    });
  }
});

// Stripe webhook handler
app.post('/api/stripe/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const result = await handleWebhook(req.body, signature, webhookSecret);
    res.json(result);
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Verify purchase and get license
app.post('/api/purchase/verify', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!stripe || !sessionId) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Create license if not exists
      const email = session.customer_details?.email || 'customer@email.com';
      const license = createLicense(email, sessionId);

      res.json({
        success: true,
        license: {
          key: license.key,
          email: license.email
        }
      });
    } else {
      res.status(402).json({ error: 'Payment not completed' });
    }
  } catch (error: any) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate license key
app.post('/api/license/validate', (req, res) => {
  const { licenseKey } = req.body;
  const license = validateLicense(licenseKey);

  if (license) {
    res.json({ valid: true, email: license.email });
  } else {
    res.status(404).json({ valid: false, error: 'Invalid license key' });
  }
});

// Download app package
app.get('/api/download/:licenseKey', (req, res) => {
  const { licenseKey } = req.params;
  const license = validateLicense(licenseKey);

  if (!license) {
    return res.status(403).json({ error: 'Invalid license key' });
  }

  // Increment download count
  incrementDownload(licenseKey);

  // In production, you'd serve a pre-built zip file
  // For now, redirect to a download URL or serve instructions
  res.json({
    success: true,
    message: 'Download authorized',
    downloadUrl: '/downloads/promogen-full.zip', // You'd host this file
    license: {
      key: license.key,
      email: license.email,
      downloadCount: license.downloadCount + 1
    }
  });
});

// ============ Setup Routes ============

// Check if app is configured
app.get('/api/setup/status', (_req, res) => {
  const config = getConfig();
  res.json({
    configured: IS_DEMO_SERVER ? false : isConfigured(),
    hasApiKey: IS_DEMO_SERVER ? false : !!config.geminiApiKey,
    demoMode: IS_DEMO_SERVER
  });
});

// Validate and save API key
app.post('/api/setup/configure', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Test the API key with a simple request
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

    try {
      await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Say "OK" if you can read this.',
      });
    } catch (apiError: any) {
      console.error('API key validation failed:', apiError.message);
      return res.status(400).json({
        error: 'Invalid API key. Please check your key and try again.',
        details: apiError.message
      });
    }

    // Save the valid API key
    saveConfig({
      geminiApiKey: apiKey.trim(),
      setupComplete: true
    });

    res.json({ success: true, message: 'API key configured successfully!' });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message || 'Setup failed' });
  }
});

// Reset configuration (for testing or reconfiguring)
app.post('/api/setup/reset', (_req, res) => {
  saveConfig({ geminiApiKey: '', setupComplete: false });
  res.json({ success: true, message: 'Configuration reset' });
});

// ============ API Routes ============

// Middleware to check configuration (or demo mode)
const requireSetup = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // In demo mode, check demo limits
  if (IS_DEMO_SERVER) {
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required for demo mode' });
    }
    const demoCheck = canUseDemo(sessionId);
    if (!demoCheck.allowed) {
      return res.status(403).json({
        error: 'Demo limit reached',
        demoLimitReached: true,
        remaining: 0
      });
    }
    return next();
  }

  // Normal mode - require API key setup
  if (!isConfigured()) {
    return res.status(403).json({
      error: 'App not configured',
      needsSetup: true
    });
  }
  next();
};

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', configured: isConfigured(), demoMode: IS_DEMO_SERVER });
});

// Daily usage status (for monitoring demo costs)
app.get('/api/daily-status', (_req, res) => {
  if (!IS_DEMO_SERVER) {
    return res.json({ message: 'Not in demo mode' });
  }
  const status = getDailyLimitStatus();
  res.json(status);
});

// Analyze product URL
app.post('/api/analyze', requireSetup, async (req, res) => {
  let chargedCredits = false;
  const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
  const requestIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';

  try {
    const { url, platform = 'instagram', conversionPreset = 'auto' } = req.body as {
      url?: string;
      platform?: SocialPlatform;
      conversionPreset?: PromoConversionPreset;
    };
    const safePreset: PromoConversionPreset = ['auto', 'fomo', 'social-proof', 'premium-authority', 'problem-solution'].includes(conversionPreset)
      ? conversionPreset
      : 'auto';


    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Please sign in to use PromoGen.', requiresAuth: true });
    }

    // Check GLOBAL daily limit for demo mode (protects against unlimited usage)
    if (IS_DEMO_SERVER) {
      const dailyCheck = checkDailyLimit();
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Demo limit reached for today. Please try again tomorrow or purchase credits to continue.',
          dailyLimitReached: true,
          reason: dailyCheck.reason
        });
      }
    }

    const ai = IS_DEMO_SERVER
      ? getAIClient(DEMO_CONFIG.demoApiKey)
      : getAIClient();

    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['analysis-only'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'analyze',
        ipAddress: requestIp,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'analysis-only',
        source: 'express',
        metadata: { failureReason: 'insufficient_credits' },
      });
      return res.status(402).json({
        error: 'Not enough credits. Purchase more credits to continue.',
        insufficientCredits: true,
        remainingCredits: charge.remaining,
      });
    }
    chargedCredits = true;

    // Check cache after charging so standalone analysis remains monetized.
    const cacheKey = `${url}::${platform}::${safePreset}`;
    const cached = getCachedAnalysis(cacheKey);
    if (cached) {
      await logUsageTelemetry({
        endpoint: 'analyze',
        ipAddress: requestIp,
        userId: authenticatedUser.id,
        success: true,
        featureId: 'analysis-only',
        creditsCharged: FEATURE_PRICING['analysis-only'].creditsRequired,
        remainingCredits: charge.remaining,
        source: 'express',
        metadata: { platform, conversionPreset: safePreset, cacheHit: true },
      });
      return res.json({ ...cached, remainingCredits: charge.remaining });
    }

    const result = await generatePromoAnalysis(ai, url, platform, safePreset);

    // Cache the result to avoid duplicate API calls
    setCachedAnalysis(cacheKey, result);

    // Track daily usage for cost control (analysis is cheap but still counts)
    if (IS_DEMO_SERVER) {
      incrementDailyUsage('analysis');
    }

    // Don't increment demo usage here - do it after successful image generation
    await logUsageTelemetry({
      endpoint: 'analyze',
      ipAddress: requestIp,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'analysis-only',
      creditsCharged: FEATURE_PRICING['analysis-only'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'express',
      metadata: { platform, conversionPreset: safePreset, cacheHit: false },
    });

    res.json({ ...result, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Analysis error:', error);
    if (chargedCredits && authenticatedUser) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['analysis-only'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'analyze',
      ipAddress: requestIp,
      userId: authenticatedUser?.id,
      success: false,
      featureId: 'analysis-only',
      refunded: chargedCredits,
      source: 'express',
      metadata: { failureReason: error.message || 'analysis_failed' },
    });
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
});

// Generate promo background image
app.post('/api/generate-image', requireSetup, async (req, res) => {
  let chargedCredits = false;
  const requestIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
  try {
    const { imagePrompt, emotionalTrigger, colors, productCategory, platform, visualStyle, conversionPreset = 'auto' } = req.body as {
      imagePrompt?: string;
      emotionalTrigger?: string;
      colors?: string[];
      productCategory?: string;
      platform?: SocialPlatform;
      visualStyle?: string;
      conversionPreset?: PromoConversionPreset;
    };
    const safePreset: PromoConversionPreset = ['auto', 'fomo', 'social-proof', 'premium-authority', 'problem-solution'].includes(conversionPreset)
      ? conversionPreset
      : 'auto';
    const sessionId = req.headers['x-session-id'] as string;
    const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Please sign in to generate promos.', requiresAuth: true });
    }

    if (!imagePrompt) {
      return res.status(400).json({ error: 'imagePrompt is required' });
    }

    // Check GLOBAL daily limit for demo mode (this is the expensive operation)
    if (IS_DEMO_SERVER) {
      const dailyCheck = checkDailyLimit();
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Demo limit reached for today. Please try again tomorrow or purchase credits to continue.',
          dailyLimitReached: true,
          reason: dailyCheck.reason
        });
      }
    }

    // Use demo API key in demo mode
    const ai = IS_DEMO_SERVER
      ? getAIClient(DEMO_CONFIG.demoApiKey)
      : getAIClient();

    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['promo-generation'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'generate-image',
        ipAddress: requestIp,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'promo-generation',
        source: 'express',
        metadata: { failureReason: 'insufficient_credits' },
      });
      return res.status(402).json({
        error: 'Not enough credits. Purchase more credits to continue.',
        insufficientCredits: true,
        remainingCredits: charge.remaining,
      });
    }
    chargedCredits = true;

    const base64Data = await generatePromoImage(ai, {
      imagePrompt,
      emotionalTrigger,
      colors,
      productCategory,
      platform,
      visualStyle,
      conversionPreset: safePreset,
    });

    // Track daily usage for cost control (image generation is the expensive part)
    if (IS_DEMO_SERVER) {
      incrementDailyUsage('generation');
    }

    // Increment demo usage after successful generation
    let demoStatus = null;
    if (IS_DEMO_SERVER && sessionId) {
      const usage = incrementDemoUsage(sessionId, req.ip);
      demoStatus = {
        generationsUsed: usage.generationsUsed,
        remaining: Math.max(0, DEMO_CONFIG.maxGenerations - usage.generationsUsed)
      };
    }

    await logUsageTelemetry({
      endpoint: 'generate-image',
      ipAddress: requestIp,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'promo-generation',
      creditsCharged: FEATURE_PRICING['promo-generation'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'express',
      metadata: { conversionPreset: safePreset, mode: 'standalone-image' },
    });

    res.json({ imageBase64: base64Data, demoStatus, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Image generation error:', error);
    const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>).catch(() => null);
    if (chargedCredits && authenticatedUser) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['promo-generation'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'generate-image',
      ipAddress: requestIp,
      userId: authenticatedUser?.id,
      success: false,
      featureId: 'promo-generation',
      refunded: chargedCredits,
      source: 'express',
      metadata: { failureReason: error.message || 'image_generation_failed' },
    });
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

app.post('/api/generate-promo', requireSetup, async (req, res) => {
  const sessionId = req.headers['x-session-id'] as string;
  const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
  let chargedCredits = false;
  const requestIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';

  try {
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Please sign in to generate promos.', requiresAuth: true });
    }

    const { url, platform = 'instagram', conversionPreset = 'auto' } = req.body as {
      url?: string;
      platform?: SocialPlatform;
      conversionPreset?: PromoConversionPreset;
    };
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const safePreset: PromoConversionPreset = ['auto', 'fomo', 'social-proof', 'premium-authority', 'problem-solution'].includes(conversionPreset)
      ? conversionPreset
      : 'auto';

    if (IS_DEMO_SERVER) {
      const dailyCheck = checkDailyLimit();
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Demo limit reached for today. Please try again tomorrow or purchase credits to continue.',
          dailyLimitReached: true,
          reason: dailyCheck.reason,
        });
      }
    }

    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['promo-generation'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'generate-promo',
        ipAddress: requestIp,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'promo-generation',
        source: 'express',
        metadata: { failureReason: 'insufficient_credits' },
      });
      return res.status(402).json({
        error: 'Not enough credits. Purchase more credits to continue.',
        insufficientCredits: true,
        remainingCredits: charge.remaining,
      });
    }
    chargedCredits = true;

    const ai = IS_DEMO_SERVER
      ? getAIClient(DEMO_CONFIG.demoApiKey)
      : getAIClient();
    const promo = await generatePromoAsset(ai, url, platform, safePreset);

    if (IS_DEMO_SERVER) {
      incrementDailyUsage('analysis');
      incrementDailyUsage('generation');
    }

    let demoStatus = null;
    if (IS_DEMO_SERVER && sessionId) {
      const usage = incrementDemoUsage(sessionId, req.ip);
      demoStatus = {
        generationsUsed: usage.generationsUsed,
        remaining: Math.max(0, DEMO_CONFIG.maxGenerations - usage.generationsUsed),
      };
    }

    await logUsageTelemetry({
      endpoint: 'generate-promo',
      ipAddress: requestIp,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'promo-generation',
      creditsCharged: FEATURE_PRICING['promo-generation'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'express',
      metadata: { platform, conversionPreset: safePreset, mode: 'atomic-promo' },
    });

    res.json({ ...promo, demoStatus, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Promo generation error:', error);
    if (chargedCredits && authenticatedUser) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['promo-generation'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'generate-promo',
      ipAddress: requestIp,
      userId: authenticatedUser?.id,
      success: false,
      featureId: 'promo-generation',
      refunded: chargedCredits,
      source: 'express',
      metadata: { failureReason: error.message || 'promo_generation_failed' },
    });
    res.status(500).json({ error: error.message || 'Failed to generate promo' });
  }
});

app.post('/api/generate-video', requireSetup, async (req, res) => {
  const requestIp = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || 'unknown';
  let chargedCredits = false;
  try {
    const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Please sign in to use video generation.', requiresAuth: true });
    }

    if (IS_DEMO_SERVER) {
      const dailyCheck = checkDailyLimit();
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Demo limit reached for today. Please try again tomorrow or purchase credits to continue.',
          dailyLimitReached: true,
          reason: dailyCheck.reason,
        });
      }
    }

    const apiKey = IS_DEMO_SERVER ? DEMO_CONFIG.demoApiKey : getConfig().geminiApiKey;
    const charge = await consumeUserCredits(authenticatedUser.id, FEATURE_PRICING['veo-video'].creditsRequired);
    if (!charge.success) {
      await logUsageTelemetry({
        endpoint: 'generate-video',
        ipAddress: requestIp,
        userId: authenticatedUser.id,
        success: false,
        featureId: 'veo-video',
        source: 'express',
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
      ipAddress: requestIp,
      userId: authenticatedUser.id,
      success: true,
      featureId: 'veo-video',
      creditsCharged: FEATURE_PRICING['veo-video'].creditsRequired,
      remainingCredits: charge.remaining,
      source: 'express',
      metadata: { mode: req.body?.mode || null },
    });

    if (IS_DEMO_SERVER) {
      incrementDailyUsage('generation');
    }

    res.json({ ...video, remainingCredits: charge.remaining });
  } catch (error: any) {
    console.error('Video generation error:', error);
    const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>).catch(() => null);
    if (chargedCredits && authenticatedUser) {
      await refundUserCredits(authenticatedUser.id, FEATURE_PRICING['veo-video'].creditsRequired).catch(() => undefined);
    }
    await logUsageTelemetry({
      endpoint: 'generate-video',
      ipAddress: requestIp,
      userId: authenticatedUser?.id,
      success: false,
      featureId: 'veo-video',
      refunded: chargedCredits,
      source: 'express',
      metadata: { failureReason: error.message || 'video_generation_failed' },
    });
    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 4ourMedia PromoGen Server`);
  console.log(`   Mode: ${IS_DEMO_SERVER ? '🎮 DEMO' : '🔒 PRODUCTION'}`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Status: ${isConfigured() ? '✅ Configured' : '⚙️  Needs setup'}\n`);
});
