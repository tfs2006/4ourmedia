/**
 * Templates & Presets System
 * 
 * Pre-designed templates that users can apply
 * Adds perceived value without additional API cost
 */

export interface PromoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'launch' | 'premium' | 'urgency' | 'social' | 'minimal';
  preview: string; // Emoji/icon representation
  styles: {
    gradientColors: string[];
    overlayOpacity: number;
    badgeStyle: 'pill' | 'banner' | 'ribbon' | 'star' | 'none';
    textPosition: 'center' | 'bottom' | 'top';
    fontStyle: 'bold' | 'elegant' | 'playful' | 'modern';
    glowEffect: boolean;
    starRating: boolean;
  };
  copyTweaks: {
    ctaPrefix?: string; // e.g., "🔥", "⚡", "✨"
    headlineStyle: 'question' | 'statement' | 'command' | 'benefit';
    urgencyLevel: 'none' | 'subtle' | 'strong';
  };
  tier: 'free' | 'pro' | 'agency'; // Which plan unlocks this
}

export const PROMO_TEMPLATES: PromoTemplate[] = [
  // FREE TEMPLATES (available in demo)
  {
    id: 'classic',
    name: 'Classic Promo',
    description: 'Clean, professional design that works for any product',
    category: 'sales',
    preview: '🎯',
    styles: {
      gradientColors: ['#4F46E5', '#7C3AED'],
      overlayOpacity: 0.7,
      badgeStyle: 'pill',
      textPosition: 'bottom',
      fontStyle: 'bold',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      headlineStyle: 'benefit',
      urgencyLevel: 'subtle'
    },
    tier: 'free'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, elegant design with focus on the product',
    category: 'minimal',
    preview: '✨',
    styles: {
      gradientColors: ['#1F2937', '#374151'],
      overlayOpacity: 0.6,
      badgeStyle: 'none',
      textPosition: 'center',
      fontStyle: 'elegant',
      glowEffect: false,
      starRating: false
    },
    copyTweaks: {
      headlineStyle: 'statement',
      urgencyLevel: 'none'
    },
    tier: 'free'
  },
  
  // PRO TEMPLATES
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    description: 'High-urgency design for limited-time offers',
    category: 'urgency',
    preview: '⚡',
    styles: {
      gradientColors: ['#DC2626', '#F97316'],
      overlayOpacity: 0.8,
      badgeStyle: 'banner',
      textPosition: 'center',
      fontStyle: 'bold',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      ctaPrefix: '⚡',
      headlineStyle: 'command',
      urgencyLevel: 'strong'
    },
    tier: 'pro'
  },
  {
    id: 'luxury',
    name: 'Luxury Premium',
    description: 'High-end aesthetic for premium products',
    category: 'premium',
    preview: '👑',
    styles: {
      gradientColors: ['#1a1a2e', '#D4AF37'],
      overlayOpacity: 0.75,
      badgeStyle: 'ribbon',
      textPosition: 'bottom',
      fontStyle: 'elegant',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      ctaPrefix: '✨',
      headlineStyle: 'benefit',
      urgencyLevel: 'none'
    },
    tier: 'pro'
  },
  {
    id: 'new-launch',
    name: 'Product Launch',
    description: 'Exciting design for new product announcements',
    category: 'launch',
    preview: '🚀',
    styles: {
      gradientColors: ['#7C3AED', '#EC4899'],
      overlayOpacity: 0.7,
      badgeStyle: 'star',
      textPosition: 'center',
      fontStyle: 'modern',
      glowEffect: true,
      starRating: false
    },
    copyTweaks: {
      ctaPrefix: '🆕',
      headlineStyle: 'statement',
      urgencyLevel: 'subtle'
    },
    tier: 'pro'
  },
  {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Trust-focused design with reviews emphasis',
    category: 'social',
    preview: '⭐',
    styles: {
      gradientColors: ['#059669', '#10B981'],
      overlayOpacity: 0.7,
      badgeStyle: 'pill',
      textPosition: 'bottom',
      fontStyle: 'modern',
      glowEffect: false,
      starRating: true
    },
    copyTweaks: {
      headlineStyle: 'benefit',
      urgencyLevel: 'none'
    },
    tier: 'pro'
  },
  {
    id: 'black-friday',
    name: 'Black Friday',
    description: 'High-contrast design for major sales events',
    category: 'urgency',
    preview: '🖤',
    styles: {
      gradientColors: ['#000000', '#FBBF24'],
      overlayOpacity: 0.85,
      badgeStyle: 'banner',
      textPosition: 'center',
      fontStyle: 'bold',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      ctaPrefix: '🔥',
      headlineStyle: 'command',
      urgencyLevel: 'strong'
    },
    tier: 'pro'
  },
  
  // AGENCY TEMPLATES
  {
    id: 'tech-modern',
    name: 'Tech Modern',
    description: 'Futuristic design for tech products',
    category: 'premium',
    preview: '💻',
    styles: {
      gradientColors: ['#0F172A', '#3B82F6'],
      overlayOpacity: 0.7,
      badgeStyle: 'pill',
      textPosition: 'center',
      fontStyle: 'modern',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      headlineStyle: 'benefit',
      urgencyLevel: 'subtle'
    },
    tier: 'agency'
  },
  {
    id: 'beauty-glow',
    name: 'Beauty Glow',
    description: 'Soft, radiant design for beauty products',
    category: 'premium',
    preview: '💄',
    styles: {
      gradientColors: ['#FDF2F8', '#EC4899'],
      overlayOpacity: 0.6,
      badgeStyle: 'ribbon',
      textPosition: 'bottom',
      fontStyle: 'elegant',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      ctaPrefix: '💕',
      headlineStyle: 'benefit',
      urgencyLevel: 'none'
    },
    tier: 'agency'
  },
  {
    id: 'fitness-energy',
    name: 'Fitness Energy',
    description: 'High-energy design for fitness/health products',
    category: 'sales',
    preview: '💪',
    styles: {
      gradientColors: ['#14532D', '#22C55E'],
      overlayOpacity: 0.75,
      badgeStyle: 'banner',
      textPosition: 'center',
      fontStyle: 'bold',
      glowEffect: true,
      starRating: true
    },
    copyTweaks: {
      ctaPrefix: '💪',
      headlineStyle: 'command',
      urgencyLevel: 'subtle'
    },
    tier: 'agency'
  },
  {
    id: 'white-label',
    name: 'White Label Clean',
    description: 'No branding - perfect for client work',
    category: 'minimal',
    preview: '⬜',
    styles: {
      gradientColors: ['#F8FAFC', '#E2E8F0'],
      overlayOpacity: 0.5,
      badgeStyle: 'none',
      textPosition: 'center',
      fontStyle: 'modern',
      glowEffect: false,
      starRating: false
    },
    copyTweaks: {
      headlineStyle: 'statement',
      urgencyLevel: 'none'
    },
    tier: 'agency'
  }
];

// Export sizes for different platforms
export const EXPORT_SIZES = {
  'story': { width: 1080, height: 1920, label: 'Story/Reel (9:16)', tier: 'free' },
  'square': { width: 1080, height: 1080, label: 'Square Post (1:1)', tier: 'pro' },
  'landscape': { width: 1920, height: 1080, label: 'Landscape (16:9)', tier: 'pro' },
  'pinterest': { width: 1000, height: 1500, label: 'Pinterest (2:3)', tier: 'pro' },
  'twitter': { width: 1200, height: 675, label: 'Twitter/X (16:9)', tier: 'agency' },
  'facebook': { width: 1200, height: 628, label: 'Facebook Link (1.91:1)', tier: 'agency' }
};

export function getTemplatesForTier(tier: 'free' | 'pro' | 'agency'): PromoTemplate[] {
  const tiers = {
    'free': ['free'],
    'pro': ['free', 'pro'],
    'agency': ['free', 'pro', 'agency']
  };
  
  return PROMO_TEMPLATES.filter(t => tiers[tier].includes(t.tier));
}

export function getSizesForTier(tier: 'free' | 'pro' | 'agency'): typeof EXPORT_SIZES {
  const tiers = {
    'free': ['free'],
    'pro': ['free', 'pro'],
    'agency': ['free', 'pro', 'agency']
  };
  
  const result: any = {};
  for (const [key, value] of Object.entries(EXPORT_SIZES)) {
    if (tiers[tier].includes(value.tier)) {
      result[key] = value;
    }
  }
  return result;
}
