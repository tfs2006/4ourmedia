export interface ProductAnalysis {
  productName: string;
  headline: string;
  subheadline: string;
  callToAction: string;
  emotionalTrigger: string;
  imagePrompt: string;
  colors: string[];
  // Enhanced audience insights
  audienceProfile?: AudienceProfile;
  copyVariations?: CopyVariation[];
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
