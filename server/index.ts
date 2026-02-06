import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { getConfig, saveConfig, isConfigured } from './config';
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
  try {
    const { url } = req.body;
    const sessionId = req.headers['x-session-id'] as string;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check cache first to save API calls
    const cached = getCachedAnalysis(url);
    if (cached) {
      return res.json(cached);
    }

    // Check GLOBAL daily limit for demo mode (protects against unlimited usage)
    if (IS_DEMO_SERVER) {
      const dailyCheck = checkDailyLimit();
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Demo limit reached for today. Please try again tomorrow or purchase a license for unlimited access.',
          dailyLimitReached: true,
          reason: dailyCheck.reason
        });
      }
    }

    // Use demo API key in demo mode
    const ai = IS_DEMO_SERVER
      ? getAIClient(DEMO_CONFIG.demoApiKey)
      : getAIClient();

    // ENHANCED: Deep audience research + marketing psychology prompt
    const prompt = `You are a world-class marketing strategist and conversion copywriter. Your job is to create VIRAL promotional content.

STEP 1 - DEEP RESEARCH (use Google Search):
Analyze this URL: ${url}
- What is this product/service?
- Who are the competitors? What are their weaknesses?
- What do reviews say? What problems do customers mention?
- What's the target demographic buying this category?
- What trends are relevant to this product?

STEP 2 - AUDIENCE PROFILING:
Based on research, define:
- Demographics (age, gender, income, location)
- Psychographics (values, lifestyle, aspirations)
- Pain points they're experiencing
- Desires they want fulfilled
- What triggers them to buy (social proof, scarcity, authority, etc.)
- Best social platforms to reach them

STEP 3 - CONVERSION COPY CREATION:
Apply these psychology principles:
- Power words: Exclusive, Instant, Proven, Secret, Guaranteed, Limited, Free, New
- Focus on TRANSFORMATION not features (before → after)
- Create desire gap (what they have vs what they could have)
- Address the #1 objection in the subheadline
- Match tone to audience (Gen Z = casual/bold, Millennials = aspirational, Boomers = trustworthy)

STEP 4 - VISUAL STRATEGY:
- Choose colors that match the emotional trigger
- Red/Orange = Urgency, excitement
- Blue = Trust, calm, professionalism  
- Purple = Luxury, creativity
- Green = Health, growth, money
- Gold/Black = Premium, exclusive
- Pink = Feminine, playful

Return this EXACT JSON structure:
{
  "productName": "Short catchy name (max 18 chars)",
  "headline": "Desire-driven hook (max 5 words) - make them FEEL the benefit",
  "subheadline": "Pain point → solution (max 10 words) - address frustration",
  "callToAction": "Urgency CTA (max 3 words)",
  "emotionalTrigger": "One of: fomo, status, security, pleasure, pain_avoidance, belonging",
  "imagePrompt": "Detailed prompt for a stunning abstract background with cinematic lighting, luxury feel, rich gradients - NO text, NO products, NO people - pure visual mood that matches the emotion",
  "colors": ["primary_hex", "secondary_hex"],
  "audienceProfile": {
    "demographics": "Specific description e.g. Women 25-40, urban, $50k+ income",
    "psychographics": "Values and lifestyle e.g. Status-conscious, time-poor, Instagram-active",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "desires": ["Desire 1", "Desire 2", "Desire 3"],
    "buyingTriggers": ["Trigger 1", "Trigger 2"],
    "competitorWeaknesses": "What competitors do wrong that we can exploit",
    "bestPlatforms": ["Instagram", "TikTok"],
    "toneOfVoice": "e.g. Bold and confident, Warm and friendly, Luxurious and exclusive"
  },
  "copyVariations": [
    {"headline": "Alternative bold headline", "subheadline": "Bold subheadline", "style": "bold"},
    {"headline": "Alternative emotional headline", "subheadline": "Emotional subheadline", "style": "emotional"},
    {"headline": "Alternative urgent headline", "subheadline": "Urgent subheadline", "style": "urgent"}
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            headline: { type: Type.STRING },
            subheadline: { type: Type.STRING },
            callToAction: { type: Type.STRING },
            emotionalTrigger: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            audienceProfile: {
              type: Type.OBJECT,
              properties: {
                demographics: { type: Type.STRING },
                psychographics: { type: Type.STRING },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                desires: { type: Type.ARRAY, items: { type: Type.STRING } },
                buyingTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorWeaknesses: { type: Type.STRING },
                bestPlatforms: { type: Type.ARRAY, items: { type: Type.STRING } },
                toneOfVoice: { type: Type.STRING }
              }
            },
            copyVariations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  subheadline: { type: Type.STRING },
                  style: { type: Type.STRING }
                }
              }
            }
          },
          required: ['productName', 'headline', 'subheadline', 'callToAction', 'emotionalTrigger', 'imagePrompt', 'colors']
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No analysis returned from Gemini' });
    }

    const result = JSON.parse(text);

    // Cache the result to avoid duplicate API calls
    setCachedAnalysis(url, result);

    // Track daily usage for cost control (analysis is cheap but still counts)
    if (IS_DEMO_SERVER) {
      incrementDailyUsage('analysis');
    }

    // Don't increment demo usage here - do it after successful image generation
    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
});

// Generate promo background image
app.post('/api/generate-image', requireSetup, async (req, res) => {
  try {
    const { imagePrompt } = req.body;
    const sessionId = req.headers['x-session-id'] as string;

    if (!imagePrompt) {
      return res.status(400).json({ error: 'imagePrompt is required' });
    }

    // Check GLOBAL daily limit for demo mode (this is the expensive operation)
    if (IS_DEMO_SERVER) {
      const dailyCheck = checkDailyLimit();
      if (!dailyCheck.allowed) {
        return res.status(429).json({
          error: 'Demo limit reached for today. Please try again tomorrow or purchase a license for unlimited access.',
          dailyLimitReached: true,
          reason: dailyCheck.reason
        });
      }
    }

    // Use demo API key in demo mode
    const ai = IS_DEMO_SERVER
      ? getAIClient(DEMO_CONFIG.demoApiKey)
      : getAIClient();

    // Psychology-enhanced image prompt for maximum visual impact
    const optimizedPrompt = `Create a stunning ${imagePrompt}. 
Style: Premium advertising campaign, cinematic lighting, rich deep colors, luxury feel.
Mood: Aspirational, exclusive, high-end brand aesthetic.
Technical: 4K quality, smooth gradients, soft bokeh, dramatic lighting.
CRITICAL: Absolutely NO text, NO words, NO letters, NO numbers, NO watermarks, NO products - pure abstract visual only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: {
        parts: [{ text: optimizedPrompt }]
      },
      config: {
        responseModalities: ['image', 'text']
      }
    });

    // Extract base64 image data
    let base64Data = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Data = part.inlineData.data;
        break;
      }
    }

    if (!base64Data) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

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

    res.json({ imageBase64: base64Data, demoStatus });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 4ourMedia PromoGen Server`);
  console.log(`   Mode: ${IS_DEMO_SERVER ? '🎮 DEMO' : '🔒 PRODUCTION'}`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Status: ${isConfigured() ? '✅ Configured' : '⚙️  Needs setup'}\n`);
});
