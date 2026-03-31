import { GoogleGenAI } from '@google/genai';
import type { ProductAnalysis, PromoConversionPreset, SocialPlatform } from '../types';

const PROMO_ANALYSIS_MODEL = process.env.GEMINI_ANALYSIS_MODEL || 'gemini-2.0-flash';
const PROMO_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

const PLATFORM_GUIDES: Record<SocialPlatform, string> = {
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
- Email Subject Lines: Curiosity or "what I discovered" style, 6-9 words`,
};

const lightingMap: Record<string, string> = {
  fear_of_missing_out: 'vibrant golden-hour side lighting with long dramatic urgency shadows and warm lens flare',
  desire_for_status: 'moody dark studio lighting with a single focused hero spotlight, deep velvety blacks and rich shadows',
  need_for_security: 'soft diffused natural daylight, airy clean bright atmosphere, open reassuring space',
  pursuit_of_pleasure: 'warm golden sunset tones, glowing inviting ambient warmth, sensuous soft bokeh',
  avoidance_of_pain: 'cool crisp clinical precision lighting, clean whites with subtle warm accent highlights',
  sense_of_belonging: 'warm golden community light, soft inclusive bokeh, inviting social atmosphere',
};

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

const compositionMap: Record<SocialPlatform, string> = {
  instagram: 'portrait vertical 4:5 composition, strong bokeh edges, strong dark gradient vignette in bottom 40%',
  tiktok: 'ultra-vertical 9:16 portrait composition, dynamic centre focus, heavy dark gradient in bottom 45%',
  facebook: 'square-friendly balanced composition, centred focal point, soft dark vignette edges and bottom',
  linkedin: 'wide horizontal 16:9 professional composition, left-to-right visual flow, gradient darkening along bottom',
  youtube: 'cinematic widescreen 16:9 composition, dramatic depth of field, gradient darkening along bottom third',
};

const categoryScene: Record<string, string> = {
  food_beverage: 'rich food photography environment, ingredient textures, steam, condensation, rustic or modern kitchen surfaces',
  fashion_apparel: 'soft fabric textures, draped cloth, refined lifestyle setting, natural light and shadow play',
  beauty_cosmetics: 'dewy surfaces, liquid droplets, soft petal textures, pastel tones, skin-care micro textures',
  health_fitness: 'dynamic outdoor natural energy, motion implied, fresh air and natural movement atmosphere',
  tech_software: 'dark glass surfaces, cool blue ambient LED light, glowing particle grid, holographic depth',
  home_lifestyle: 'warm interior candlelight bokeh, textured wood and fabric, cozy domestic warmth',
  business_finance: 'modern glass office exterior at dusk, city lights bokeh, sleek cool-toned reflections',
  entertainment_media: 'dramatic stage or cinema lighting, bold colour streaks, dynamic light trails, spectacle',
  sports_outdoor: 'rugged terrain textures - rock, water, dirt - raw natural energy, movement and impact',
  pets: 'warm morning light on natural fabrics, soft garden textures, cosy and gentle atmosphere',
  education: 'clean bright study surface, soft focus paper and book textures, inspiring natural daylight',
  travel: 'expansive aerial landscape - coastline, mountains or golden-hour city - aspirational wide open space',
  default: 'richly layered deep colour gradient, soft glowing particle bokeh, cinematic depth',
};

const PRESET_FALLBACK_TRIGGER: Record<Exclude<PromoConversionPreset, 'auto'>, string> = {
  fomo: 'fear_of_missing_out',
  'social-proof': 'sense_of_belonging',
  'premium-authority': 'desire_for_status',
  'problem-solution': 'avoidance_of_pain',
};

const PRESET_PROFILE: Record<Exclude<PromoConversionPreset, 'auto'>, {
  label: string;
  objective: string;
  copyRules: string;
  visualRules: string;
}> = {
  fomo: {
    label: 'Scarcity + Urgency (FOMO)',
    objective: 'Drive immediate action with scarcity and momentum cues.',
    copyRules: 'Use limited-time language, speed-to-benefit framing, and immediate CTA wording. Keep lines punchy and action-first.',
    visualRules: 'High contrast, energetic movement cues, urgency color accents, and bold compositional tension.',
  },
  'social-proof': {
    label: 'Trust + Social Proof',
    objective: 'Increase confidence by signaling popularity and community validation.',
    copyRules: 'Highlight adoption signals, credibility cues, and confidence language. Avoid hype; sound trusted and proven.',
    visualRules: 'Warm, inviting scenes with friendly depth, reliability tones, and polished but approachable styling.',
  },
  'premium-authority': {
    label: 'Premium Positioning + Authority',
    objective: 'Improve perceived value and status to support premium conversion.',
    copyRules: 'Use confident, benefit-led language with exclusivity cues and outcome sophistication.',
    visualRules: 'Editorial lighting, refined contrast, luxurious texture cues, and premium-grade composition.',
  },
  'problem-solution': {
    label: 'Pain-to-Relief (Problem/Solution)',
    objective: 'Convert practical buyers by emphasizing friction removal and clear outcomes.',
    copyRules: 'Lead with the pain point, then immediate relief and practical benefit. Keep claims concrete and specific.',
    visualRules: 'Clean, clarity-first visual atmosphere with reassuring structure and strong readability zones.',
  },
};

function normalizeConversionPreset(preset?: PromoConversionPreset): PromoConversionPreset {
  if (!preset) return 'auto';
  const allowed: PromoConversionPreset[] = ['auto', 'fomo', 'social-proof', 'premium-authority', 'problem-solution'];
  return allowed.includes(preset) ? preset : 'auto';
}

function buildPresetInstruction(preset: PromoConversionPreset): string {
  if (preset === 'auto') {
    return 'Mode: AUTO BEST-FIT. Select the most conversion-effective psychology strategy for this product and audience automatically. Prioritize likely click-through and conversion outcomes over creativity.';
  }

  const profile = PRESET_PROFILE[preset];
  return `Mode: FORCED PRESET - ${profile.label}\nObjective: ${profile.objective}\nCopy Direction: ${profile.copyRules}\nVisual Direction: ${profile.visualRules}\nPrimary trigger preference: ${PRESET_FALLBACK_TRIGGER[preset]}`;
}

function buildPresetImageDirection(preset: PromoConversionPreset): string {
  if (preset === 'auto') {
    return 'Auto-select the visual energy level and emotional framing most likely to improve conversion for this category and platform.';
  }

  return PRESET_PROFILE[preset].visualRules;
}

function extractJsonPayload(text: string) {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedJson ? fencedJson[1].trim() : text.trim();
}

export async function generatePromoAnalysis(
  ai: GoogleGenAI,
  url: string,
  platform: SocialPlatform = 'instagram',
  conversionPreset: PromoConversionPreset = 'auto'
): Promise<ProductAnalysis> {
  const platformGuide = PLATFORM_GUIDES[platform] || PLATFORM_GUIDES.instagram;
  const normalizedPreset = normalizeConversionPreset(conversionPreset);
  const presetInstruction = buildPresetInstruction(normalizedPreset);

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

=== CONVERSION PRESET STRATEGY ===
${presetInstruction}

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

=== STEP 4: PRODUCT CATEGORY & VISUAL IDENTITY ===

FIRST - classify the product into ONE of these categories (this drives the entire visual direction):
- food_beverage: Food products, drinks, supplements, snacks, restaurants
- fashion_apparel: Clothing, shoes, accessories, jewelry, bags
- beauty_cosmetics: Skincare, makeup, haircare, fragrance, grooming
- health_fitness: Workout gear, supplements, wellness, yoga, sports equipment
- tech_software: Apps, SaaS, gadgets, electronics, devices
- home_lifestyle: Furniture, decor, kitchen, cleaning, organization
- business_finance: B2B tools, consulting, finance, productivity, courses
- entertainment_media: Games, music, video, books, content subscriptions
- sports_outdoor: Outdoor gear, athletic equipment, adventure, bikes
- pets: Pet food, toys, accessories, healthcare
- education: Courses, tutoring, books, e-learning, skills
- travel: Hotels, tours, transport, luggage, travel accessories
- default: Anything else

THEN - identify the visual style that fits the brand positioning:
Use ONE of: luxury | vibrant | minimal | natural | bold | playful | professional | cinematic | editorial

=== STEP 5: SCENE-AWARE IMAGE PROMPT ENGINEERING ===

Using the product category and emotional trigger, construct a HIGHLY SPECIFIC background image prompt.

SCENE BASE - match to category:
- food_beverage: overhead kitchen counter with scattered raw ingredients (herbs, spices, produce), dramatic side lighting, realistic food photography style
- fashion_apparel: sun-drenched soft fabric textures, draped cloth folds, scattered accessories on marble or wood
- beauty_cosmetics: dewy marble surface with scattered flower petals and liquid droplets, soft bokeh
- health_fitness: misty early-morning outdoor landscape, dew on grass, golden sunrise rays through trees, dynamic energy
- tech_software: dark glass desk surface reflecting cool ambient blue light, glowing particle streaks, holographic depth
- home_lifestyle: warm interior scene with bokeh candlelight, textured wood grain, cozy ambient warmth
- business_finance: sleek modern office exterior glass reflections at dusk, cool blue city lights bokeh in background
- entertainment_media: cinematic deep space or dramatic stage lighting, vibrant colour streaks, dynamic light trails
- sports_outdoor: rugged natural terrain close-up - cracked earth, rushing water, mountain rock - dynamic energy
- pets: warm cosy living room bokeh, soft natural morning light on fabric textures, nature-inspired warmth
- education: clean bright study surface, scattered papers and open books in soft bokeh, inspiring daylight
- travel: sweeping aerial landscape - coastline, mountain range or city at golden hour - expansive and aspirational
- default: dramatic layered abstract colour gradient, soft glowing particles, depth of field bokeh

LIGHTING - match to emotional trigger:
- fear_of_missing_out: vibrant golden-hour side lighting with long dramatic urgency shadows and warm lens flare
- desire_for_status: moody dark studio lighting with single hero spotlight, deep rich blacks and velvety shadows
- need_for_security: soft diffused natural daylight, airy clean bright atmosphere, reassuring open space
- pursuit_of_pleasure: warm golden sunset tones, glowing inviting ambient warmth, soft sensuous bokeh
- avoidance_of_pain: cool crisp clinical precision lighting, clean whites with subtle warm accent highlights
- sense_of_belonging: warm community golden light, soft inclusive bokeh, inviting social atmosphere

COMPOSITION RULES (always include ALL of these):
1. The bottom 40% of the image must darken strongly via natural vignette or gradient - this is where text will overlay
2. Leave an open empty mid-ground with no focal subject - the product name and headline go here
3. Bokeh depth of field to create separation between foreground texture and soft background
4. No text, no words, no letters, no numbers, no watermarks, no logos, no human faces, no hands, no identifiable products, no UI screens

BUILD THE imagePrompt as a single flowing paragraph using: [SCENE BASE] + [LIGHTING] + [COLOR PALETTE from colors array] + [COMPOSITION RULES] + [QUALITY SUFFIX]

Quality suffix to always end with: "Photorealistic, Phase One IQ4 150MP medium format camera, 85mm f/1.4 lens, cinematic color grade, 8K resolution, award-winning advertising photography."

=== STEP 6: COLOR PSYCHOLOGY ===

Pick 2 hex colors that work for the brand and reinforce the message:
- Red/Orange: Urgency, energy, appetite, excitement
- Blue: Trust, calm, professionalism, reliability
- Green: Growth, health, wealth, nature, freshness
- Purple: Luxury, creativity, wisdom, royalty
- Gold/Yellow: Premium, optimism, happiness, wealth
- Black: Sophistication, power, elegance, exclusivity
- Pink: Playful, romantic, feminine, youthful

=== STEP 7: PLATFORM-SPECIFIC SOCIAL CONTENT KIT ===

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
  "productCategory": "[ONE of: food_beverage, fashion_apparel, beauty_cosmetics, health_fitness, tech_software, home_lifestyle, business_finance, entertainment_media, sports_outdoor, pets, education, travel, default]",
  "visualStyle": "[ONE of: luxury, vibrant, minimal, natural, bold, playful, professional, cinematic, editorial]",
  "imagePrompt": "[Single flowing paragraph combining: scene base matching productCategory + lighting matching emotionalTrigger + reference to the primary hex color from colors array + all 4 composition rules + quality suffix. This must be a rich, specific, scene-grounded description - NO generic words like 'atmospheric' or 'abstract gradients' alone]",
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
✓ productCategory correctly identifies the product type?
✓ imagePrompt contains a SPECIFIC scene (not just "atmospheric abstract") with lighting, color, and composition details?
✓ imagePrompt ends with the quality suffix?
✓ Caption follows the platform length/tone guide exactly?
✓ Hashtags start with # and match the platform count?
✓ videoHook is punchy and platform-appropriate?
✓ imagePrompt has NO text/products/people?`;

  const response = await ai.models.generateContent({
    model: PROMO_ANALYSIS_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No analysis returned from Gemini');
  }

  const parsed = JSON.parse(extractJsonPayload(text)) as ProductAnalysis;

  if (normalizedPreset !== 'auto' && !parsed.emotionalTrigger) {
    parsed.emotionalTrigger = PRESET_FALLBACK_TRIGGER[normalizedPreset];
  }

  return {
    ...parsed,
    appliedPreset: normalizedPreset,
    presetStrategy: normalizedPreset === 'auto' ? 'Auto Best-Fit (AI selected)' : PRESET_PROFILE[normalizedPreset].label,
  };
}

export function buildPromoImagePrompt(input: {
  imagePrompt: string;
  emotionalTrigger?: string;
  colors?: string[];
  productCategory?: string;
  platform?: SocialPlatform;
  visualStyle?: string;
  conversionPreset?: PromoConversionPreset;
}) {
  const normalizedPreset = normalizeConversionPreset(input.conversionPreset);
  const lighting = lightingMap[input.emotionalTrigger || ''] || 'cinematic premium lighting, dramatic shadows';
  const styleGuide = styleMap[input.visualStyle || ''] || styleMap.cinematic;
  const presetDirection = buildPresetImageDirection(normalizedPreset);
  const composition = compositionMap[input.platform || 'instagram'] || compositionMap.instagram;
  const sceneEnhancement = categoryScene[input.productCategory || ''] || categoryScene.default;
  const colorSpec = Array.isArray(input.colors) && input.colors.length > 0
    ? `Dominant colour palette must prominently feature ${input.colors[0]}${input.colors[1] ? ` as primary and ${input.colors[1]} as secondary accent` : ''}. Apply as colour grade and tonal base throughout the image.`
    : '';

  return `${input.imagePrompt}

SCENE ENVIRONMENT: ${sceneEnhancement}
LIGHTING: ${lighting}
VISUAL STYLE: ${styleGuide}
CONVERSION PRESET LOOK: ${presetDirection}
COMPOSITION: ${composition}
${colorSpec}
COMPOSITION RULES: The bottom 40% of the image must darken naturally through deep vignette or natural shadow - this zone is reserved for text overlay. Leave an open empty mid-ground with no dominant focal subject. Use shallow depth of field with bokeh to separate foreground texture from soft background.
ABSOLUTE RESTRICTIONS: NO text of any kind, NO words, NO letters, NO numbers, NO watermarks, NO logos, NO brand identifiers, NO human faces, NO hands, NO identifiable products or packaging, NO UI screens or devices - pure atmospheric background scene only.
QUALITY: Photorealistic, Phase One IQ4 150MP medium format camera, 85mm f/1.4 lens, cinema-grade colour treatment, 8K resolution, award-winning advertising photography.`;
}

export async function generatePromoImage(
  ai: GoogleGenAI,
  input: {
    imagePrompt: string;
    emotionalTrigger?: string;
    colors?: string[];
    productCategory?: string;
    platform?: SocialPlatform;
    visualStyle?: string;
    conversionPreset?: PromoConversionPreset;
  }
) {
  const optimizedPrompt = buildPromoImagePrompt(input);
  const response = await ai.models.generateContent({
    model: PROMO_IMAGE_MODEL,
    contents: { parts: [{ text: optimizedPrompt }] },
    config: { responseModalities: ['IMAGE', 'TEXT'] },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error('Failed to generate image');
}

export async function generatePromoAsset(
  ai: GoogleGenAI,
  url: string,
  platform: SocialPlatform = 'instagram',
  conversionPreset: PromoConversionPreset = 'auto'
) {
  const analysis = await generatePromoAnalysis(ai, url, platform, conversionPreset);
  const imageBase64 = await generatePromoImage(ai, {
    imagePrompt: analysis.imagePrompt,
    emotionalTrigger: analysis.emotionalTrigger,
    colors: analysis.colors,
    productCategory: analysis.productCategory,
    platform,
    visualStyle: analysis.visualStyle,
    conversionPreset,
  });

  return { analysis, imageBase64 };
}