import { ProductAnalysis } from "../types";
import type { SocialPlatform } from "../types";

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

function getSessionId(): string {
  return localStorage.getItem('demo_session_id') || '';
}

// Get user ID from localStorage (set by auth system)
function getUserId(): string {
  try {
    const authData = localStorage.getItem('sb-pzmmllhpklcwmmeycxpm-auth-token');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.user?.id || '';
    }
  } catch {
    // Ignore parse errors
  }
  return '';
}

export const analyzeProductUrl = async (url: string, platform: SocialPlatform = 'instagram'): Promise<ProductAnalysis> => {
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    'x-session-id': getSessionId()
  };
  
  // Add user ID if authenticated (for rate limiting)
  const userId = getUserId();
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url, platform })
  });

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
  demoStatus?: {
    generationsUsed: number;
    remaining: number;
  };
}

export const generatePromoBackground = async (imagePrompt: string): Promise<string> => {
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    'x-session-id': getSessionId()
  };
  
  // Add user ID if authenticated (for rate limiting)
  const userId = getUserId();
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const response = await fetch(`${API_BASE}/api/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imagePrompt })
  });

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
  
  return data.imageBase64;
};
