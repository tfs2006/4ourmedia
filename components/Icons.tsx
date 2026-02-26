import React from 'react';

// ============================================================
// PromoGen Custom SVG Icon Library
// One-of-a-kind icons designed specifically for PromoGen
// ============================================================

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// Aperture / Lens icon – brand icon
export const ApertureIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="ap-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED"/>
        <stop offset="100%" stopColor="#2563EB"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#ap-g)" strokeWidth="1.5" fill="none"/>
    <ellipse cx="12" cy="7" rx="2" ry="4.5" fill="url(#ap-g)" opacity="0.8" transform="rotate(0 12 12)"/>
    <ellipse cx="12" cy="7" rx="2" ry="4.5" fill="url(#ap-g)" opacity="0.8" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="7" rx="2" ry="4.5" fill="url(#ap-g)" opacity="0.8" transform="rotate(120 12 12)"/>
    <ellipse cx="12" cy="7" rx="2" ry="4.5" fill="url(#ap-g)" opacity="0.8" transform="rotate(180 12 12)"/>
    <ellipse cx="12" cy="7" rx="2" ry="4.5" fill="url(#ap-g)" opacity="0.8" transform="rotate(240 12 12)"/>
    <ellipse cx="12" cy="7" rx="2" ry="4.5" fill="url(#ap-g)" opacity="0.8" transform="rotate(300 12 12)"/>
    <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
  </svg>
);

// Magic Wand / Sparkle icon
export const MagicWandIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <line x1="5" y1="19" x2="16" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <polygon points="16,3 17.5,6.5 21,8 17.5,9.5 16,13 14.5,9.5 11,8 14.5,6.5" fill="currentColor" opacity="0.9"/>
    <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" opacity="0.5"/>
    <circle cx="19.5" cy="17.5" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="3" cy="15" r="1" fill="currentColor" opacity="0.3"/>
  </svg>
);

// Lightning / Speed icon (styled)
export const SpeedIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="13,2 4,14 11,14 11,22 20,10 13,10" fill="currentColor" opacity="0.9"/>
    <line x1="2" y1="8" x2="5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <line x1="1" y1="11" x2="3" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <line x1="2" y1="14" x2="5" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Rocket icon (custom)
export const RocketIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C12 2 7 7 7 13a5 5 0 0010 0C17 7 12 2 12 2z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="13" r="2" fill="currentColor" opacity="0.9"/>
    <path d="M7 14l-3 3 2 2 2-2M17 14l3 3-2 2-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    <path d="M10 20c0 1 0.9 2 2 2s2-1 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// Star / Quality icon (5-point, elegant)
export const StarIcon: React.FC<IconProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="12,2 14.9,9.1 22.5,9.1 16.8,13.7 18.9,21 12,16.9 5.1,21 7.2,13.7 1.5,9.1 9.1,9.1" fill={color} opacity="0.9"/>
  </svg>
);

// Brain / AI icon
export const AIBrainIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9.5 2C7 2 5 4 5 6.5c-1.5 0.5-2.5 2-2.5 3.5 0 1.5 0.8 2.8 2 3.4C4.5 15.5 6.2 17 8.5 17H12V2H9.5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M14.5 2C17 2 19 4 19 6.5c1.5 0.5 2.5 2 2.5 3.5 0 1.5-0.8 2.8-2 3.4C19.5 15.5 17.8 17 15.5 17H12V2H14.5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="9" r="1" fill="currentColor" opacity="0.7"/>
    <circle cx="16" cy="9" r="1" fill="currentColor" opacity="0.7"/>
    <line x1="8" y1="7" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <line x1="16" y1="7" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

// Trophy / Achievement icon
export const TrophyIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 3h12v8a6 6 0 01-12 0V3z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 3h3v5.5A2.5 2.5 0 013 6V3zM21 3h-3v5.5A2.5 2.5 0 0021 6V3z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 8l1.5 1.5L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Dollar / ROI icon (coin with spark)
export const ROIIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="11" cy="13" r="8" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
    <text x="11" y="17.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor" fontFamily="system-ui">$</text>
    <polygon points="19,2 19.7,4.3 22,5 19.7,5.7 19,8 18.3,5.7 16,5 18.3,4.3" fill="currentColor" opacity="0.8"/>
  </svg>
);

// Users / Community icon
export const CommunityIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="9" cy="7" r="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="17" cy="7" r="2.5" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 14c1.7 0.3 3.2 1.5 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

// Template / Layers icon
export const TemplateIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="6" y="6" width="5" height="12" rx="1.5" fill="currentColor" opacity="0.4"/>
    <rect x="13" y="6" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4"/>
    <rect x="13" y="13" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.2"/>
  </svg>
);

// Image / Photo icon
export const ImageIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8.5" cy="8.5" r="2" fill="currentColor" opacity="0.6"/>
    <path d="M3 17l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

// Download / Export icon
export const DownloadIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 3v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7.5 11.5L12 16l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Shield / Security icon
export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L4 5v7c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5L12 2z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Check / Success icon (circle)
export const CheckCircleIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// X / Close icon
export const CloseIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// Clock / Timer icon
export const TimerIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="13" r="8" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="13" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="12" y1="13" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="9" y1="2" x2="15" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Palette / Design icon
export const PaletteIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.3 0 2-0.9 2-2 0-0.5-0.2-1-0.5-1.4s-0.5-0.9-0.5-1.4c0-1.1 0.9-2 2-2h2.5C19.9 15.2 22 13.3 22 11 22 6 17.5 2 12 2z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6.5" cy="11.5" r="1.5" fill="currentColor" opacity="0.8"/>
    <circle cx="9" cy="7" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="14" cy="6.5" r="1.5" fill="currentColor" opacity="0.7"/>
    <circle cx="17.5" cy="10" r="1.5" fill="currentColor" opacity="0.5"/>
  </svg>
);

// Trending Up / Graph icon
export const TrendingUpIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polyline points="2,18 9,11 13,15 22,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17,6 22,6 22,11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 21h20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

// Infinity / Unlimited icon
export const InfinityIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 000 8c2 0 4-1.5 6-4z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 000-8c-2 0-4 1.5-6 4z" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

// Crown / Premium icon
export const CrownIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="2,19 4,8 8.5,13.5 12,5 15.5,13.5 20,8 22,19" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <rect x="2" y="19" width="20" height="2" rx="1" fill="currentColor" opacity="0.5"/>
    <circle cx="12" cy="9" r="1.5" fill="currentColor" opacity="0.7"/>
  </svg>
);

// Flame / Hot / Streak icon
export const FlameIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2c0 4-4 5-4 9a6 6 0 0012 0c0-3-2-5-3-7-1 2-2 3-2 4.5a2.5 2.5 0 01-5 0C10 5.5 12 2 12 2z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 14c-1 0-1.8 0.4-2 1a2 2 0 004 0c-0.2-0.6-1-1-2-1z" fill="currentColor" opacity="0.8"/>
  </svg>
);

// Gift / Reward icon
export const GiftIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="10" width="18" height="12" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="3" y="6" width="18" height="4" rx="1" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="6" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7.5 6C7.5 4 9 3 10.5 3s2.5 1.5 1.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M16.5 6C16.5 4 15 3 13.5 3s-2.5 1.5-1.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Sparkles / Magic icon
export const SparklesIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="12,2 13.2,8 18,9 13.2,10 12,16 10.8,10 6,9 10.8,8" fill="currentColor" opacity="0.9"/>
    <polygon points="5,3 5.6,5.4 8,6 5.6,6.6 5,9 4.4,6.6 2,6 4.4,5.4" fill="currentColor" opacity="0.5"/>
    <polygon points="19,16 19.5,18 21.5,18.5 19.5,19 19,21 18.5,19 16.5,18.5 18.5,18" fill="currentColor" opacity="0.6"/>
  </svg>
);

// Arrow Right icon
export const ArrowRightIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 12h14M13 7l6 5-6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Lock icon
export const LockIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor" opacity="0.7"/>
  </svg>
);

// Sad face (replacing 😢)
export const SadFaceIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="9" cy="10" r="1.2" fill="currentColor" opacity="0.7"/>
    <circle cx="15" cy="10" r="1.2" fill="currentColor" opacity="0.7"/>
    <path d="M8 16.5c1-1.5 2-2 4-2s3 0.5 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 8l-1.5-1.5M14 8l1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Party / Celebration (replacing 🎉)
export const CelebrationIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 21l6-14 8 8L3 21z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="15" cy="5" r="1.5" fill="currentColor" opacity="0.6"/>
    <circle cx="20" cy="9" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="18" cy="2" r="1" fill="currentColor" opacity="0.4"/>
    <polygon points="19,14 19.5,16 21.5,16.5 19.5,17 19,19 18.5,17 16.5,16.5 18.5,16" fill="currentColor" opacity="0.5"/>
  </svg>
);

// Lightbulb / Tip icon (replacing 💡)
export const LightbulbIcon: React.FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 21h6M10 21v-2h4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 3A6 6 0 006 9c0 2.2 1.2 4.1 3 5.2V17h6v-2.8C16.8 13.1 18 11.2 18 9A6 6 0 0012 3z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="5" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <line x1="7" y1="7.5" x2="8.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <line x1="17" y1="7.5" x2="15.5" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Mobile / Story icon
export const MobileIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="3" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <circle cx="12" cy="19" r="1" fill="currentColor" opacity="0.5"/>
    <rect x="8" y="9" width="8" height="7" rx="1" fill="currentColor" opacity="0.2"/>
  </svg>
);

// Package / Product icon
export const PackageIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <polyline points="2,7 12,12 22,7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="12" y1="12" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="7" y1="4.5" x2="17" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

// Globe / Web icon  
export const GlobeIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="1.5"/>
    <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
  </svg>
);

// Avatar / Person icon (replacing emoji avatars)
export const AvatarArtistIcon: React.FC<IconProps> = ({ className = '', size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="20" fill="url(#av1)"/>
    <defs>
      <linearGradient id="av1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7C3AED"/>
        <stop offset="100%" stopColor="#DB2777"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="15" r="6" fill="white" opacity="0.9"/>
    <path d="M8 36c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="white" opacity="0.3"/>
    {/* Palette hint */}
    <circle cx="26" cy="27" r="5" fill="#DB2777"/>
    <circle cx="25" cy="26" r="1" fill="white" opacity="0.8"/>
    <circle cx="27" cy="28" r="0.8" fill="white" opacity="0.6"/>
  </svg>
);

export const AvatarMarketerIcon: React.FC<IconProps> = ({ className = '', size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="20" fill="url(#av2)"/>
    <defs>
      <linearGradient id="av2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0EA5E9"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="15" r="6" fill="white" opacity="0.9"/>
    <path d="M8 36c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="white" opacity="0.3"/>
    {/* Graph hint */}
    <circle cx="27" cy="26" r="5" fill="#0EA5E9"/>
    <polyline points="24,29 26,27 28,28" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const AvatarFounderIcon: React.FC<IconProps> = ({ className = '', size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="20" cy="20" r="20" fill="url(#av3)"/>
    <defs>
      <linearGradient id="av3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F59E0B"/>
        <stop offset="100%" stopColor="#EF4444"/>
      </linearGradient>
    </defs>
    <circle cx="20" cy="15" r="6" fill="white" opacity="0.9"/>
    <path d="M8 36c0-6.6 5.4-12 12-12s12 5.4 12 12" fill="white" opacity="0.3"/>
    {/* Rocket hint */}
    <circle cx="27" cy="27" r="5" fill="#F59E0B"/>
    <polygon points="27,24 28.5,27.5 27,26.5 25.5,27.5" fill="white" opacity="0.9"/>
  </svg>
);

// Upload / URL icon
export const UploadIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Refresh icon
export const RefreshIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M20 8A9 9 0 005.5 5.5L3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M4 16a9 9 0 0014.5 2.5L21 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <polyline points="3,3 3,8 8,8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="21,21 21,16 16,16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Alert / Warning icon
export const AlertIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10.3 3.5L2.5 18A2 2 0 004.2 21h15.6a2 2 0 001.7-3L14 3.5a2 2 0 00-3.4 0z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="12" y1="10" x2="12" y2="14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor" opacity="0.9"/>
  </svg>
);

// Card / Payment icon
export const CardIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="6" y1="14" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="17" cy="14" r="2.5" fill="currentColor" opacity="0.3"/>
    <circle cx="15" cy="14" r="2.5" fill="currentColor" opacity="0.5"/>
  </svg>
);

export default {
  ApertureIcon, MagicWandIcon, SpeedIcon, RocketIcon, StarIcon, AIBrainIcon,
  TrophyIcon, ROIIcon, CommunityIcon, TemplateIcon, ImageIcon, DownloadIcon,
  ShieldIcon, CheckCircleIcon, CloseIcon, TimerIcon, PaletteIcon, TrendingUpIcon,
  InfinityIcon, CrownIcon, FlameIcon, GiftIcon, SparklesIcon, ArrowRightIcon,
  LockIcon, SadFaceIcon, CelebrationIcon, LightbulbIcon, MobileIcon, PackageIcon,
  GlobeIcon, AvatarArtistIcon, AvatarMarketerIcon, AvatarFounderIcon, UploadIcon,
  RefreshIcon, AlertIcon, CardIcon
};
