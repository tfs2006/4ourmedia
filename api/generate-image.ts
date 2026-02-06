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
    const { imagePrompt } = req.body;

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

    // Enhanced prompt for better images
    const optimizedPrompt = `Create a stunning ${imagePrompt}. 
Style: Premium advertising campaign, cinematic lighting, rich deep colors, luxury feel.
Mood: Aspirational, exclusive, high-end brand aesthetic.
Technical: 4K quality, smooth gradients, soft bokeh, dramatic lighting.
CRITICAL: Absolutely NO text, NO words, NO letters, NO numbers, NO watermarks, NO products - pure abstract visual only.`;

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
