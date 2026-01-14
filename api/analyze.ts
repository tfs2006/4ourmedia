import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

// Simple in-memory cache
const analysisCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

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

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Check cache first
    const cached = getCached(url);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'API key not configured', needsSetup: true });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an elite conversion copywriter. Analyze: ${url}

PSYCHOLOGY RULES:
- Use power words (Exclusive, Instant, Proven, Secret, Guaranteed, Limited)
- Focus on transformation & emotion, not features
- Create desire gap (what they have vs what they could have)
- Imply urgency/scarcity subtly

Return JSON:
- productName: Short catchy name (max 18 chars)
- headline: Desire-driven hook (max 5 words) - make them FEEL the benefit
- subheadline: Pain point → solution (max 8 words) - address their frustration
- callToAction: Urgency CTA (max 3 words) - "Get Yours Now", "Claim Your Spot", etc
- emotionalTrigger: The core emotion to target (one of: fear_of_missing_out, desire_for_status, need_for_security, pursuit_of_pleasure, avoidance_of_pain, sense_of_belonging)
- imagePrompt: Premium abstract background (cinematic lighting, luxury bokeh, rich gradients) matching the emotion - NO text/products/screens
- colors: [accent_hex, secondary_hex] - psychology-matched (red=urgency, blue=trust, gold=premium, green=growth)`;

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
            colors: { type: Type.ARRAY, items: { type: Type.STRING } }
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
    setCache(url, result);
    
    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
}
