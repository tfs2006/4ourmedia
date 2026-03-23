import type { GeneratedAsset, ProductAnalysis, SocialPlatform } from "../types";
import { getSession } from './supabase';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const ANALYZE_TIMEOUT_MS = 45000;
const GENERATE_TIMEOUT_MS = 70000;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getSessionId(): string {
  return localStorage.getItem('demo_session_id') || '';
}

async function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
  };

  const session = await getSession();
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

export const analyzeProductUrl = async (url: string, platform: SocialPlatform = 'instagram'): Promise<ProductAnalysis> => {
  const headers = await getAuthHeaders();

  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, platform })
    }, ANALYZE_TIMEOUT_MS);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Product analysis took too long. Please try again in a few seconds.');
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    if (error.needsSetup) {
      throw new Error('Please configure your API key first.');
    }
    if (error.requiresAuth) {
      throw new Error('Please sign in to use the demo.');
    }
    if (error.demoLimitReached) {
      throw new Error('Demo limit reached. Purchase the full version to continue.');
    }
    // Handle rate limiting
    if (response.status === 429) {
      throw new Error(error.error || 'Too many requests. Please slow down.');
    }
    // Handle service unavailable (limits reached)
    if (response.status === 503) {
      throw new Error(error.error || 'Service temporarily unavailable. Please try again later.');
    }
    throw new Error(error.error || 'Failed to analyze URL');
  }

  return response.json();
};

export interface GenerateImageResult {
  imageBase64: string;
  remainingCredits?: number;
  demoStatus?: {
    generationsUsed: number;
    remaining: number;
  };
}

export const generatePromoBackground = async (
  imagePrompt: string,
  context?: Pick<ProductAnalysis, 'emotionalTrigger' | 'colors' | 'productCategory' | 'visualStyle' | 'audienceProfile'>,
  platform?: SocialPlatform
): Promise<GenerateImageResult> => {
  const headers = await getAuthHeaders();

  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE}/api/generate-image`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imagePrompt,
        emotionalTrigger: context?.emotionalTrigger,
        colors: context?.colors,
        productCategory: context?.productCategory,
        visualStyle: context?.visualStyle,
        toneOfVoice: context?.audienceProfile?.toneOfVoice,
        platform: platform || 'instagram',
      })
    }, GENERATE_TIMEOUT_MS);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Image generation took too long. Please try again.');
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    if (error.needsSetup) {
      throw new Error('Please configure your API key first.');
    }
    if (error.requiresAuth) {
      throw new Error('Please sign in to use the demo.');
    }
    if (error.demoLimitReached) {
      throw new Error('Demo limit reached. Purchase the full version to continue.');
    }
    // Handle rate limiting
    if (response.status === 429) {
      throw new Error(error.error || 'Too many requests. Please slow down.');
    }
    // Handle service unavailable (limits reached)
    if (response.status === 503) {
      throw new Error(error.error || 'Service temporarily unavailable. Please try again later.');
    }
    throw new Error(error.error || 'Failed to generate image');
  }

  const data: GenerateImageResult = await response.json();
  
  // Dispatch event with demo status so App can update
  if (data.demoStatus) {
    window.dispatchEvent(new CustomEvent('demo-status-update', { 
      detail: data.demoStatus 
    }));
  }
  
  return data;
};

export const generatePromoAsset = async (
  url: string,
  platform: SocialPlatform = 'instagram'
): Promise<GeneratedAsset> => {
  const headers = await getAuthHeaders();

  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE}/api/generate-promo`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, platform })
    }, GENERATE_TIMEOUT_MS);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Promo generation timed out. Try the same URL again or test a simpler product page.');
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    if (error.needsSetup) {
      throw new Error('Please configure your API key first.');
    }
    if (error.requiresAuth) {
      throw new Error('Please sign in to use the demo.');
    }
    if (error.demoLimitReached) {
      throw new Error('Demo limit reached. Purchase the full version to continue.');
    }
    if (response.status === 429) {
      throw new Error(error.error || 'Too many requests. Please slow down.');
    }
    if (response.status === 503) {
      throw new Error(error.error || 'Service temporarily unavailable. Please try again later.');
    }
    throw new Error(error.error || 'Failed to generate promo');
  }

  const data: GeneratedAsset = await response.json();

  if (data.demoStatus) {
    window.dispatchEvent(new CustomEvent('demo-status-update', {
      detail: data.demoStatus
    }));
  }

  return data;
};
