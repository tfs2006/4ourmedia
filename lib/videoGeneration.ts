import { GoogleGenAI } from '@google/genai';
import type { SerializedMediaFile, VideoGenerationPayload } from '../types';

interface GeneratedVideoAsset {
  videoBase64: string;
  mimeType: string;
  fileName: string;
}

function toInlineImage(file: SerializedMediaFile) {
  return {
    imageBytes: file.data,
    mimeType: file.mimeType,
  };
}

function getVideoFileName(prompt: string) {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${slug || 'veo-creation'}-${Date.now()}.mp4`;
}

export async function generateVideoAsset(apiKey: string, payload: VideoGenerationPayload): Promise<GeneratedVideoAsset> {
  const ai = new GoogleGenAI({ apiKey });

  if (!payload.prompt?.trim()) {
    throw new Error('Prompt is required');
  }

  let operation: any;

  if (payload.mode === 'assets') {
    if (!payload.assetImages.length) {
      throw new Error('At least one reference image is required');
    }

    const referenceImages = payload.assetImages.map((file) => ({
      image: toInlineImage(file),
      referenceType: 'ASSET',
    }));

    operation = await (ai.models as any).generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: payload.prompt,
      config: {
        numberOfVideos: 1,
        referenceImages,
        resolution: '720p',
        aspectRatio: '16:9',
      },
    });
  } else {
    if (!payload.startFrame) {
      throw new Error('A start frame is required');
    }

    operation = await (ai.models as any).generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: payload.prompt,
      image: toInlineImage(payload.startFrame),
      config: {
        numberOfVideos: 1,
        lastFrame: payload.endFrame ? toInlineImage(payload.endFrame) : undefined,
        resolution: payload.resolution,
        aspectRatio: payload.aspectRatio,
      },
    });
  }

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    operation = await (ai.operations as any).getVideosOperation({ operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error('No video URI returned from Gemini Veo');
  }

  const separator = videoUri.includes('?') ? '&' : '?';
  const downloadResponse = await fetch(`${videoUri}${separator}key=${apiKey}`);
  if (!downloadResponse.ok) {
    const errorText = await downloadResponse.text().catch(() => 'No error details');
    throw new Error(`Failed to download video (${downloadResponse.status}): ${errorText || downloadResponse.statusText}`);
  }

  const buffer = Buffer.from(await downloadResponse.arrayBuffer());

  return {
    videoBase64: buffer.toString('base64'),
    mimeType: downloadResponse.headers.get('content-type') || 'video/mp4',
    fileName: getVideoFileName(payload.prompt),
  };
}