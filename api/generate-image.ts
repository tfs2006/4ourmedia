import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Session tracking for demo limits (backup - Supabase is primary)
const sessionUsage = new Map<string, { generationsUsed: number }>();
const MAX_DEMO_GENERATIONS = 3;

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id, x-user-id');
  
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

  // Require login for demo mode
  if (process.env.DEMO_MODE === 'true') {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in to use the demo.', requiresAuth: true });
    }
  }

  try {
    const { imagePrompt, emotionalTrigger, colors, productCategory, platform, visualStyle, toneOfVoice } = req.body;

    if (!imagePrompt) {
      return res.status(400).json({ error: 'imagePrompt is required' });
    }

    // Check per-session limit in demo mode (backup check)
    if (process.env.DEMO_MODE === 'true' && sessionId) {
      const usage = sessionUsage.get(sessionId) || { generationsUsed: 0 };
      if (usage.generationsUsed >= MAX_DEMO_GENERATIONS) {
        return res.status(403).json({ 
          error: 'Demo limit reached. Purchase credits for unlimited access!',
          demoLimitReached: true,
          remaining: 0
        });
      }
    }

    const apiKey = process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'API key not configured', needsSetup: true });
    }

    const ai = new GoogleGenAI({ apiKey });

    // --- Build a context-aware prompt instead of generic luxury wrapper ---

    // Lighting matched to the emotional trigger
    const lightingMap: Record<string, string> = {
      fear_of_missing_out: 'vibrant golden-hour side lighting with long dramatic urgency shadows and warm lens flare',
      desire_for_status: 'moody dark studio lighting with a single focused hero spotlight, deep velvety blacks and rich shadows',
      need_for_security: 'soft diffused natural daylight, airy clean bright atmosphere, open reassuring space',
      pursuit_of_pleasure: 'warm golden sunset tones, glowing inviting ambient warmth, sensuous soft bokeh',
      avoidance_of_pain: 'cool crisp clinical precision lighting, clean whites with subtle warm accent highlights',
      sense_of_belonging: 'warm golden community light, soft inclusive bokeh, inviting social atmosphere',
    };

    // Visual style matched to brand positioning
    const styleMap: Record<string, string> = {
      luxury: 'ultra-premium editorial quality, deep shadows, rich desaturated tones, Vogue/Vanity Fair aesthetic',
      vibrant: 'highly saturated vibrant energy, punchy contrast, electric colour palette',
      minimal: 'clean minimalist composition, generous negative space, subtle muted tones',
      natural: 'organic authentic textures, earthy warm tones, imperfect natural beauty',
      bold: 'high contrast graphic impact, strong shapes, powerful dramatic presence',
      playful: 'bright cheerful fun atmosphere, saturated warm colours, energetic joyful mood',
      professional: 'clean corporate precision, cool neutral tones, confident structured composition',
      cinematic: 'Hollywood blockbuster cinematic grade, anamorphic lens flare, epic scale lighting',
      editorial: 'fashion editorial photographic quality, asymmetric avant-garde composition',
    };

    // Composition guidance per platform
    const compositionMap: Record<string, string> = {
      instagram: 'portrait vertical 4:5 composition, strong bokeh edges, strong dark gradient vignette in bottom 40%',
      tiktok: 'ultra-vertical 9:16 portrait composition, dynamic centre focus, heavy dark gradient in bottom 45%',
      facebook: 'square-friendly balanced composition, centred focal point, soft dark vignette edges and bottom',
      linkedin: 'wide horizontal 16:9 professional composition, left-to-right visual flow, gradient darkening along bottom',
      youtube: 'cinematic widescreen 16:9 composition, dramatic depth of field, gradient darkening along bottom third',
    };

    // Category-specific scene enhancement
    const categoryScene: Record<string, string> = {
      food_beverage: 'rich food photography environment, ingredient textures, steam, condensation, rustic or modern kitchen surfaces',
      fashion_apparel: 'soft fabric textures, draped cloth, refined lifestyle setting, natural light and shadow play',
      beauty_cosmetics: 'dewy surfaces, liquid droplets, soft petal textures, pastel tones, skin-care micro textures',
      health_fitness: 'dynamic outdoor natural energy, motion implied, fresh air and natural movement atmosphere',
      tech_software: 'dark glass surfaces, cool blue ambient LED light, glowing particle grid, holographic depth',
      home_lifestyle: 'warm interior candlelight bokeh, textured wood and fabric, cozy domestic warmth',
      business_finance: 'modern glass office exterior at dusk, city lights bokeh, sleek cool-toned reflections',
      entertainment_media: 'dramatic stage or cinema lighting, bold colour streaks, dynamic light trails, spectacle',
      sports_outdoor: 'rugged terrain textures — rock, water, dirt — raw natural energy, movement and impact',
      pets: 'warm morning light on natural fabrics, soft garden textures, cosy and gentle atmosphere',
      education: 'clean bright study surface, soft focus paper and book textures, inspiring natural daylight',
      travel: 'expansive aerial landscape — coastline, mountains or golden-hour city — aspirational wide open space',
      default: 'richly layered deep colour gradient, soft glowing particle bokeh, cinematic depth',
    };

    const lighting = lightingMap[emotionalTrigger] || 'cinematic premium lighting, dramatic shadows';
    const styleGuide = styleMap[visualStyle] || styleMap['cinematic'];
    const composition = compositionMap[platform] || compositionMap['instagram'];
    const sceneEnhancement = categoryScene[productCategory] || categoryScene['default'];

    // Colour specification from the analysis palette
    const colorSpec = Array.isArray(colors) && colors.length > 0
      ? `Dominant colour palette must prominently feature ${colors[0]}${colors[1] ? ` as primary and ${colors[1]} as secondary accent` : ''}. Apply as colour grade and tonal base throughout the image.`
      : '';

    const optimizedPrompt = `${imagePrompt}

SCENE ENVIRONMENT: ${sceneEnhancement}
LIGHTING: ${lighting}
VISUAL STYLE: ${styleGuide}
COMPOSITION: ${composition}
${colorSpec}
COMPOSITION RULES: The bottom 40% of the image must darken naturally through deep vignette or natural shadow — this zone is reserved for text overlay. Leave an open empty mid-ground with no dominant focal subject. Use shallow depth of field with bokeh to separate foreground texture from soft background.
ABSOLUTE RESTRICTIONS: NO text of any kind, NO words, NO letters, NO numbers, NO watermarks, NO logos, NO brand identifiers, NO human faces, NO hands, NO identifiable products or packaging, NO UI screens or devices — pure atmospheric background scene only.
QUALITY: Photorealistic, Phase One IQ4 150MP medium format camera, 85mm f/1.4 lens, cinema-grade colour treatment, 8K resolution, award-winning advertising photography.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: { parts: [{ text: optimizedPrompt }] },
      config: { responseModalities: ['image', 'text'] }
    });

    // Extract base64 image
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

    res.json({ imageBase64: base64Data, demoStatus });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
