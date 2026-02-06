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

    const prompt = `You are an elite marketing research analyst and conversion copywriter with expertise in consumer psychology. Your task is to deeply analyze the provided URL and create compelling promotional content.

=== STEP 1: COMPREHENSIVE URL ANALYSIS ===
Thoroughly investigate this URL: ${url}

RESEARCH CHECKLIST (use Google Search to verify everything):
□ What EXACTLY is being sold/promoted? (product, service, software, content, brand)
□ If it's a marketplace page (Amazon, eBay, Etsy, etc.) with multiple items, identify the PRIMARY/FEATURED product
□ What is the exact product name, brand, and category?
□ What are the KEY FEATURES that matter most to buyers?
□ What PROBLEM does this solve? What pain point does it address?
□ Who is the TARGET AUDIENCE? (demographics, psychographics)
□ What is the PRICE POINT? (budget, mid-range, premium, luxury)
□ What do REVIEWS say? What do customers love/hate?
□ Who are the COMPETITORS? What makes this different?
□ Is this a well-known brand or emerging? What's the trust level?

URL TYPE DETECTION:
- E-commerce Product (Amazon, Shopify, etc.): Focus on the SPECIFIC product, not the store
- Service/SaaS: Focus on the transformation/results clients achieve
- Content/Media: Focus on the value/entertainment/education provided
- Portfolio/Personal Brand: Focus on credibility and unique value proposition
- Local Business: Focus on convenience, trust, and community connection
- Informational Site: Focus on the core message and call-to-action

=== STEP 2: BUYER PSYCHOLOGY DEEP DIVE ===
Think like the IDEAL CUSTOMER:

TRANSFORMATION FOCUS:
- What does their life look like BEFORE? (the problem, frustration, desire)
- What does their life look like AFTER? (the result, satisfaction, achievement)
- What FEELING do they want to experience? (confidence, relief, excitement, status)
- What would they BRAG about to friends after buying?

DESIRE TRIGGERS (identify the primary one):
- Fear of Missing Out: Limited availability, trending, everyone has it
- Status & Identity: Premium, exclusive, says something about who they are  
- Security & Peace of Mind: Protection, reliability, worry-free
- Pleasure & Enjoyment: Fun, delicious, beautiful, satisfying
- Pain Avoidance: Solves annoying problem, saves time/effort/money
- Belonging & Connection: Community, shared experience, relationships

=== STEP 3: CRAFT IRRESISTIBLE COPY ===

POWER WORDS TO USE:
Urgency: Now, Today, Instant, Quick, Fast, Limited, Last Chance
Exclusivity: Exclusive, Members-Only, VIP, Secret, Insider, Elite
Trust: Proven, Guaranteed, Certified, Authentic, Official, Real
Transformation: Unlock, Discover, Transform, Achieve, Master, Become
Value: Free, Save, Bonus, Extra, Premium, Ultimate

COPY RULES:
1. Lead with the OUTCOME, not the product
2. Use "You/Your" language - make it personal
3. Create a "desire gap" between current state and possible state
4. Be SPECIFIC - vague claims don't convert
5. Inject subtle urgency without being pushy

=== STEP 4: VISUAL STRATEGY ===

IMAGE CONCEPT:
- Must visually represent the EMOTION of ownership/usage
- Abstract/atmospheric backgrounds that evoke the feeling
- Color psychology that reinforces the message
- Premium, cinematic quality that elevates perceived value
- NEVER include: text, logos, product images, screens, faces, hands

COLOR PSYCHOLOGY:
- Red/Orange: Urgency, energy, appetite, excitement
- Blue: Trust, calm, professionalism, reliability
- Green: Growth, health, wealth, nature, freshness
- Purple: Luxury, creativity, wisdom, royalty
- Gold/Yellow: Premium, optimism, happiness, wealth
- Black: Sophistication, power, elegance, exclusivity
- Pink: Playful, romantic, feminine, youthful

=== OUTPUT FORMAT ===
Based on your thorough analysis, return this JSON:

{
  "productName": "[Catchy 2-3 word name, max 18 chars - capture the essence]",
  "headline": "[5 words MAX - the transformation/benefit they'll experience, make them FEEL it]",
  "subheadline": "[8 words MAX - acknowledge the pain point, promise the solution]",
  "callToAction": "[3 words MAX - urgent, action-oriented: 'Get Yours Now', 'Start Today', 'Claim Your Spot']",
  "emotionalTrigger": "[ONE of: fear_of_missing_out, desire_for_status, need_for_security, pursuit_of_pleasure, avoidance_of_pain, sense_of_belonging]",
  "imagePrompt": "[Detailed atmospheric background description: lighting style, color gradients, mood, texture - must evoke the emotional trigger. Example: 'Cinematic golden hour lighting with warm amber bokeh, soft luxury fabric textures, aspirational wealthy lifestyle atmosphere' - NO text/products/people]",
  "colors": ["[primary accent hex - matches emotion]", "[secondary complement hex]"],
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
}

QUALITY CHECK BEFORE RESPONDING:
✓ Is the productName accurate to what's ACTUALLY being sold?
✓ Does the headline promise a clear, desirable OUTCOME?
✓ Does the subheadline address a real PAIN POINT?
✓ Is the CTA action-oriented and urgent?
✓ Does the imagePrompt match the emotional trigger?
✓ Are colors psychologically aligned with the message?`;

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
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    setCache(url, result);
    
    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
}
