import type { GeneratedVideo, SerializedMediaFile, VideoGenerationConfig, VideoGenerationPayload } from '../types';
import { getSession } from './supabase';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const VIDEO_REQUEST_TIMEOUT_MS = 70000;

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function serializeFile(file: File): Promise<SerializedMediaFile> {
  return {
    name: file.name,
    mimeType: file.type || 'image/png',
    data: await fileToBase64(file),
  };
}

function base64ToBlob(base64: string, mimeType: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    byteNumbers[index] = byteCharacters.charCodeAt(index);
  }

  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

export async function generatePromoVideo(config: VideoGenerationConfig): Promise<GeneratedVideo> {
  const payload: VideoGenerationPayload = {
    prompt: config.prompt,
    mode: config.mode,
    assetImages: await Promise.all(config.assetImages.map((file) => serializeFile(file))),
    startFrame: config.startFrame ? await serializeFile(config.startFrame) : null,
    endFrame: config.endFrame ? await serializeFile(config.endFrame) : null,
    aspectRatio: config.aspectRatio,
    resolution: config.resolution,
  };

  const headers = await getAuthHeaders();

  let response: Response;
  try {
    response = await fetchWithTimeout(`${API_BASE}/api/generate-video`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }, VIDEO_REQUEST_TIMEOUT_MS);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Video generation timed out. Please retry with fewer assets or a shorter prompt.');
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));

    if (error.needsSetup) {
      throw new Error('Please configure your API key first.');
    }
    if (error.requiresAuth) {
      throw new Error('Please sign in to use video generation.');
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

    throw new Error(error.error || 'Failed to generate video');
  }

  const data = await response.json();
  const blob = base64ToBlob(data.videoBase64, data.mimeType || 'video/mp4');
  const url = URL.createObjectURL(blob);

  return {
    url,
    blob,
    mimeType: data.mimeType || 'video/mp4',
    fileName: data.fileName || `veo-creation-${Date.now()}.mp4`,
    remainingCredits: typeof data.remainingCredits === 'number' ? data.remainingCredits : undefined,
  };
}