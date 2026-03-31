export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'youtube';

export type PromoConversionPreset = 'auto' | 'fomo' | 'social-proof' | 'premium-authority' | 'problem-solution';

export type VideoGenerationMode = 'assets' | 'frames';
export type VideoAspectRatio = '16:9' | '9:16';
export type VideoResolution = '720p' | '1080p';

export interface SerializedMediaFile {
  name: string;
  mimeType: string;
  data: string;
}

export interface VideoGenerationPayload {
  prompt: string;
  mode: VideoGenerationMode;
  assetImages: SerializedMediaFile[];
  startFrame: SerializedMediaFile | null;
  endFrame: SerializedMediaFile | null;
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
}

export interface VideoGenerationConfig {
  prompt: string;
  mode: VideoGenerationMode;
  assetImages: File[];
  startFrame: File | null;
  endFrame: File | null;
  aspectRatio: VideoAspectRatio;
  resolution: VideoResolution;
}

export interface GeneratedVideo {
  url: string;
  blob: Blob;
  mimeType: string;
  fileName: string;
  remainingCredits?: number;
}

export interface VideoGenerationStatus {
  isGenerating: boolean;
  progressMessage: string;
  error?: string;
}

export interface SocialContentKit {
  caption: string;            // Ready-to-post caption for the chosen platform
  hashtags: string[];         // 20-25 hashtags
  videoHook: string;          // TikTok/Reels hook (first 3 seconds)
  emailSubjectLines: string[]; // 3 email subject line options
}

export interface ProductAnalysis {
  productName: string;
  headline: string;
  subheadline: string;
  callToAction: string;
  emotionalTrigger: string;
  imagePrompt: string;
  colors: string[];
  // Product classification for scene-aware image generation
  productCategory?: string;
  visualStyle?: string;
  // Social content kit (platform-specific)
  socialContent?: SocialContentKit;
  // Enhanced audience insights
  audienceProfile?: AudienceProfile;
  copyVariations?: CopyVariation[];
  // Optional preset strategy metadata for low-friction high-conversion generation
  appliedPreset?: PromoConversionPreset;
  presetStrategy?: string;
}

export interface AudienceProfile {
  demographics: string;        // "Women 25-44, urban professionals"
  psychographics: string;      // "Status-conscious, time-poor, quality-seekers"
  painPoints: string[];        // ["Limited time", "Want convenience"]
  desires: string[];           // ["Look successful", "Save time"]
  buyingTriggers: string[];    // ["Social proof", "Scarcity"]
  competitorWeaknesses: string; // "Competitors are too expensive/slow"
  bestPlatforms: string[];     // ["Instagram", "TikTok"]
  toneOfVoice: string;         // "Aspirational yet approachable"
}

export interface CopyVariation {
  headline: string;
  subheadline: string;
  style: 'bold' | 'emotional' | 'rational' | 'urgent';
}

export interface GeneratedAsset {
  imageBase64: string;
  analysis: ProductAnalysis;
  remainingCredits?: number;
  demoStatus?: {
    generationsUsed: number;
    remaining: number;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  COMPOSITING = 'COMPOSITING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type AspectRatio = '9:16' | '1:1' | '16:9' | '4:5';

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number; label: string }> = {
  '9:16': { width: 1080, height: 1920, label: 'Story / Reel' },
  '1:1': { width: 1080, height: 1080, label: 'Square Post' },
  '16:9': { width: 1920, height: 1080, label: 'YouTube / Banner' },
  '4:5': { width: 1080, height: 1350, label: 'Instagram Post' },
};

// Brand Kit - saved branding settings
export interface BrandKit {
  id: string;
  name: string;
  logo: string | null;         // Base64 or URL
  logoPosition: LogoPosition;
  logoSize: number;            // Percentage width
  displayUrl: string;
  primaryColor: string;        // Hex
  secondaryColor: string;      // Hex
  fontStyle: 'modern' | 'classic' | 'bold' | 'playful';
  createdAt: string;
  updatedAt: string;
}

// Promo History Item
export interface HistoryItem {
  id: string;
  url: string;
  analysis: ProductAnalysis;
  backgroundImage: string;     // Base64
  finalImage: string;          // Base64 of composite
  brandKitId?: string;
  createdAt: string;
  thumbnail?: string;          // Smaller preview
}

// Daily Credit Status
export interface DailyCreditStatus {
  lastClaimDate: string;       // ISO date string
  dailyCreditAvailable: boolean;
  streakDays: number;
  totalFreeCreditsEarned: number;
}
