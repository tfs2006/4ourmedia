export type BotPlanId = 'bot-starter' | 'bot-pro' | 'bot-elite';

export interface BotProductPlan {
  id: BotPlanId;
  name: string;
  priceInCents: number;
  description: string;
  badge?: string;
  fileName: string;
  contentType: 'text/markdown';
  features: string[];
}

export const BOT_PRODUCT_PLANS: Record<BotPlanId, BotProductPlan> = {
  'bot-starter': {
    id: 'bot-starter',
    name: 'Starter Personality Pack',
    priceInCents: 14900,
    description: 'Momentum + Mean Reversion starter templates with quick-start setup docs.',
    badge: 'ENTRY',
    fileName: 'starter-personality-pack.md',
    contentType: 'text/markdown',
    features: [
      '2 personality profiles (Momentum + Mean Reversion)',
      'Risk guardrails starter config',
      'BYOK AI model setup guide',
      'Single-user license',
    ],
  },
  'bot-pro': {
    id: 'bot-pro',
    name: 'Pro Personality Pack',
    priceInCents: 34900,
    description: 'Multi-style bot pack for serious operators and small teams.',
    badge: 'MOST POPULAR',
    fileName: 'pro-personality-pack.md',
    contentType: 'text/markdown',
    features: [
      '5 personality profiles',
      'Advanced risk and confidence presets',
      'Platform/BYOK setup matrix',
      'Priority update access',
    ],
  },
  'bot-elite': {
    id: 'bot-elite',
    name: 'Elite Commercial Pack',
    priceInCents: 99900,
    description: 'Commercial-ready personality catalog with resale support docs.',
    badge: 'BEST VALUE',
    fileName: 'elite-commercial-pack.md',
    contentType: 'text/markdown',
    features: [
      '10 personality profiles',
      'Commercial usage + resale templates',
      'Launch checklist + support playbook',
      'Premium update channel',
    ],
  },
};

export const BOT_PLAN_IDS = Object.keys(BOT_PRODUCT_PLANS) as BotPlanId[];

export function formatBotPrice(planId: BotPlanId) {
  return `$${(BOT_PRODUCT_PLANS[planId].priceInCents / 100).toFixed(0)}`;
}
