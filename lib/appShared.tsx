import { lazy } from 'react';
import { RefreshCw } from 'lucide-react';
import type { PromoConversionPreset, DailyCreditStatus } from '../types';

export const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
export const AdminDashboardPage = lazy(() => import('../components/AdminDashboardPage'));
export const PromoCanvas = lazy(() => import('../components/PromoCanvas'));
export const LoadingStep = lazy(() => import('../components/LoadingStep'));
export const PurchaseModal = lazy(() => import('../components/PurchaseModalNew'));
export const AuthModal = lazy(() => import('../components/AuthModal'));
export const FreeToolsPage = lazy(() => import('../components/FreeToolsPage'));
export const PerplexityPage = lazy(() => import('../components/PerplexityPage'));
export const VeoStudioPage = lazy(() => import('../components/VeoStudioPage'));
export const PrivacyPolicy = lazy(() => import('../components/LegalPages').then((module) => ({ default: module.PrivacyPolicy })));
export const TermsOfService = lazy(() => import('../components/LegalPages').then((module) => ({ default: module.TermsOfService })));
export const RefundPolicy = lazy(() => import('../components/LegalPages').then((module) => ({ default: module.RefundPolicy })));
export const ContactPage = lazy(() => import('../components/LegalPages').then((module) => ({ default: module.ContactPage })));
export const PROMOFINDER_ORIGIN = 'https://promofinder.4ourmedia.com';

export type ViewState = 'landing' | 'app' | 'privacy' | 'terms' | 'refund' | 'contact' | 'free-tools' | 'perplexity' | 'veo-studio' | 'admin';

export const PATH_TO_VIEW_STATE: Record<string, ViewState> = {
  '/': 'landing',
  '/app': 'app',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/refund': 'refund',
  '/contact': 'contact',
  '/free-tools': 'free-tools',
  '/perplexity': 'perplexity',
  '/veo-studio': 'veo-studio',
  '/admin': 'admin',
};

export const VIEW_STATE_TO_PATH: Partial<Record<ViewState, string>> = {
  landing: '/',
  app: '/app',
  privacy: '/privacy',
  terms: '/terms',
  refund: '/refund',
  contact: '/contact',
  'free-tools': '/free-tools',
  perplexity: '/perplexity',
  'veo-studio': '/veo-studio',
  admin: '/admin',
};

export const CONVERSION_PRESETS: Array<{ id: PromoConversionPreset; label: string; blurb: string; trigger: string }> = [
  {
    id: 'auto',
    label: 'Auto Best-Fit',
    blurb: 'AI picks the highest-converting psychology approach automatically.',
    trigger: 'Adaptive',
  },
  {
    id: 'fomo',
    label: 'Urgency / FOMO',
    blurb: 'Scarcity and momentum messaging for fast action.',
    trigger: 'Fear of Missing Out',
  },
  {
    id: 'social-proof',
    label: 'Social Proof',
    blurb: 'Trust-forward framing that signals popularity and validation.',
    trigger: 'Belonging + Trust',
  },
  {
    id: 'premium-authority',
    label: 'Premium Authority',
    blurb: 'High-value positioning with status and expertise cues.',
    trigger: 'Status + Identity',
  },
  {
    id: 'problem-solution',
    label: 'Problem → Solution',
    blurb: 'Clear pain-to-relief framing for practical buyers.',
    trigger: 'Pain Avoidance',
  },
];

export function PageLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white" role="status" aria-live="polite" aria-label={label}>
      <div className="pg-bg" />
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm rounded-3xl border border-slate-800 bg-slate-900/70 px-8 py-10 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
            <RefreshCw className="h-8 w-8 animate-spin text-violet-300" />
          </div>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300/80">PromoGen</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-sm text-slate-500">This view is loading in a separate chunk to keep the main app fast.</p>
        </div>
      </div>
    </div>
  );
}

export function ModalLoader({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6" role="status" aria-live="polite" aria-label={label}>
      <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-900/85 px-6 py-5 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
          <RefreshCw className="h-6 w-6 animate-spin text-violet-300" />
        </div>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300/80">PromoGen</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-2 text-xs text-slate-500">Just a moment while the modal loads.</p>
      </div>
    </div>
  );
}

// Daily credit helper functions (localStorage fallback for non-authenticated users)
export function getDailyCreditStatus(): DailyCreditStatus {
  try {
    const stored = localStorage.getItem('promo_daily_credit');
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    lastClaimDate: '',
    dailyCreditAvailable: true,
    streakDays: 0,
    totalFreeCreditsEarned: 0
  };
}

export function saveDailyCreditStatus(status: DailyCreditStatus) {
  localStorage.setItem('promo_daily_credit', JSON.stringify(status));
}

export function checkDailyCredit(): { available: boolean; streakDays: number } {
  const status = getDailyCreditStatus();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (status.lastClaimDate === today) {
    return { available: false, streakDays: status.streakDays };
  }
  
  // Check if streak continues
  let newStreakDays = status.streakDays;
  if (status.lastClaimDate === yesterday) {
    newStreakDays = status.streakDays; // Will be incremented on claim
  } else if (status.lastClaimDate !== '') {
    newStreakDays = 0; // Streak broken
  }
  
  return { available: true, streakDays: newStreakDays };
}

export function claimDailyCredit(): number {
  const status = getDailyCreditStatus();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Calculate streak
  let newStreakDays = 1;
  if (status.lastClaimDate === yesterday) {
    newStreakDays = status.streakDays + 1;
  }
  
  // Bonus credits for streaks!
  let bonusCredits = 0;
  if (newStreakDays === 7) bonusCredits = 2;  // 7-day streak = 2 bonus
  if (newStreakDays === 30) bonusCredits = 5; // 30-day streak = 5 bonus
  
  const totalCredits = 1 + bonusCredits;
  
  saveDailyCreditStatus({
    lastClaimDate: today,
    dailyCreditAvailable: false,
    streakDays: newStreakDays,
    totalFreeCreditsEarned: status.totalFreeCreditsEarned + totalCredits
  });
  
  return totalCredits;
}
