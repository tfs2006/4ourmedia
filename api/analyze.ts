import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

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

  // Require login for demo mode
  if (process.env.DEMO_MODE === 'true') {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in to use the demo.', requiresAuth: true });
    }
  }

  try {
    const { url, platform = 'instagram' } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const validPlatforms = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube'];
    const safePlatform = validPlatforms.includes(platform) ? platform : 'instagram';

    // Check cache first (include platform in cache key)
    const cacheKey = `${url}::${safePlatform}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const apiKey = process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'API key not configured', needsSetup: true });
    }

    const ai = new GoogleGenAI({ apiKey });

    const PLATFORM_GUIDES: Record<string, string> = {
      instagram: `PLATFORM: Instagram
- Caption: 150-200 words, conversational & aspirational, 1-2 line breaks for readability, end with a soft CTA question to boost comments ("Which one would you pick? 👇"), use 3-5 emojis naturally
- Hashtags: 25 hashtags — mix of niche (10k-200k posts), mid-tier (200k-2M), and broad (2M+). Include product-specific, lifestyle, and community tags
- Video Hook: Short punchy Reels hook under 8 words, designed to stop scrolling in the first 2 seconds (e.g. "POV: You finally found it" or "This changed everything →")
- Email Subject Lines: Curiosity-gap or benefit-driven, 6-9 words each`,
      tiktok: `PLATFORM: TikTok
- Caption: 80-120 words, punchy, direct, Gen-Z friendly. Start with a bold claim or surprising fact. Use short sentences. 2-3 emojis max. End with CTA to comment or follow
- Hashtags: 5-8 hashtags only — trending TikTok tags + 2 niche. Prioritize discoverability over quantity
- Video Hook: Ultra-short TikTok hook under 6 words, designed for the first 0.5 seconds (e.g. "Wait you need to see this" or "This is literally insane →")
- Email Subject Lines: Bold, provocative, FOMO-driven, 5-8 words`,
      facebook: `PLATFORM: Facebook
- Caption: 180-250 words, friendly & story-driven, slightly longer format. Build context, share a mini-story or scenario, then reveal the product as the solution. 1-2 emojis. End with a clear CTA link prompt
- Hashtags: 3-5 hashtags only, broad and relevant
- Video Hook: Conversational Facebook Reels hook, relatable scenario opener (e.g. "Anyone else tired of..." or "Here's what nobody tells you about...")
- Email Subject Lines: Story-based or question-driven, 7-10 words`,
      linkedin: `PLATFORM: LinkedIn
- Caption: 200-300 words, professional, insight-driven. Open with a bold data point or provocative statement. Share the problem → solution narrative. Use line breaks generously. End with a thought-provoking question. No emojis or max 1
- Hashtags: 3-5 professional hashtags (industry + function + trend)
- Video Hook: Professional insight hook (e.g. "Most marketers overlook this..." or "Here's what $1M brands do differently...")
- Email Subject Lines: Professional, ROI-focused, 6-9 words`,
      youtube: `PLATFORM: YouTube
- Caption: 200-300 words, SEO-optimized video description style. First 2 lines must hook viewers before "show more". Include the main benefit, what they'll discover in the video, and a mid-paragraph CTA. Use timestamps placeholder [0:00] style
- Hashtags: 10-15 hashtags — YouTube-specific discovery tags, long-tail keyword-style
- Video Hook: YouTube thumbnail + title hook combo (e.g. "I tried this for 30 days..." or "Why everyone is wrong about...")
- Email Subject Lines: Curiosity or "what I discovered" style, 6-9 words`
    };

    const platformGuide = PLATFORM_GUIDES[safePlatform] || PLATFORM_GUIDES['instagram'];

    const prompt = `You are an elite marketing research analyst, conversion copywriter, and social media strategist with deep expertise in consumer psychology and platform-native content. Your task is to deeply analyze the provided URL and create a complete promotional content kit.

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

URL TYPE DETECTION:
- E-commerce Product (Amazon, Shopify, etc.): Focus on the SPECIFIC product, not the store
- Service/SaaS: Focus on the transformation/results clients achieve
- Content/Media: Focus on the value/entertainment/education provided
- Portfolio/Personal Brand: Focus on credibility and unique value proposition
- Local Business: Focus on convenience, trust, and community connection

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

=== STEP 3: CRAFT IRRESISTIBLE IMAGE COPY ===

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

=== STEP 5: PLATFORM-SPECIFIC SOCIAL CONTENT KIT ===

${platformGuide}

Generate ALL four social content items (caption, hashtags, videoHook, emailSubjectLines) following the platform guide above EXACTLY.

For hashtags: Return ONLY the hashtag strings in the array (e.g. "#fashionista"), not the # repeated. Each entry must start with #.

=== OUTPUT FORMAT ===
Return ONLY this JSON, no other text:

{
  "productName": "[Catchy 2-3 word name, max 18 chars]",
  "headline": "[5 words MAX - transformation/benefit]",
  "subheadline": "[8 words MAX - pain point + solution]",
  "callToAction": "[3 words MAX - urgent action verb]",
  "emotionalTrigger": "[ONE of: fear_of_missing_out, desire_for_status, need_for_security, pursuit_of_pleasure, avoidance_of_pain, sense_of_belonging]",
  "imagePrompt": "[Detailed atmospheric background: lighting, gradients, mood, texture - NO text/products/people]",
  "colors": ["[primary hex]", "[secondary hex]"],
  "socialContent": {
    "caption": "[Platform-optimized ready-to-post caption following the guide above]",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "videoHook": "[Platform-specific video/reel hook text]",
    "emailSubjectLines": ["Subject line 1", "Subject line 2", "Subject line 3"]
  },
  "audienceProfile": {
    "demographics": "e.g. Women 25-40, urban, $50k+ income",
    "psychographics": "e.g. Status-conscious, time-poor, Instagram-active",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "desires": ["Desire 1", "Desire 2", "Desire 3"],
    "buyingTriggers": ["Trigger 1", "Trigger 2"],
    "competitorWeaknesses": "What competitors do wrong",
    "bestPlatforms": ["Instagram", "TikTok"],
    "toneOfVoice": "e.g. Bold and confident"
  },
  "copyVariations": [
    {"headline": "Bold headline variant", "subheadline": "Bold subheadline", "style": "bold"},
    {"headline": "Emotional headline variant", "subheadline": "Emotional subheadline", "style": "emotional"},
    {"headline": "Urgent headline variant", "subheadline": "Urgent subheadline", "style": "urgent"}
  ]
}

QUALITY CHECK:
✓ productName accurate to what's ACTUALLY sold?
✓ Caption follows the platform length/tone guide exactly?
✓ Hashtags start with # and match the platform count?
✓ videoHook is punchy and platform-appropriate?
✓ imagePrompt has NO text/products/people?`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No analysis returned from Gemini' });
    }

    // Extract JSON from the response (may be wrapped in markdown code fences)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);
    setCache(cacheKey, result);
    
    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze URL' });
  }
}
