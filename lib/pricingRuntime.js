export const TARGET_PROFIT_MARGIN = 0.8;

const LOWEST_REVENUE_PER_CREDIT_USD = 99 / 500;

function requiredCreditsForTargetMargin(costUsd) {
  const minimumRevenue = costUsd / (1 - TARGET_PROFIT_MARGIN);
  return Math.max(1, Math.ceil(minimumRevenue / LOWEST_REVENUE_PER_CREDIT_USD));
}

export const FEATURE_PRICING = {
  'analysis-only': {
    id: 'analysis-only',
    label: 'Standalone content analysis',
    estimatedCostUsd: 0.01,
    creditsRequired: requiredCreditsForTargetMargin(0.01),
  },
  'promo-generation': {
    id: 'promo-generation',
    label: 'Standard promo generation',
    estimatedCostUsd: 0.02,
    creditsRequired: requiredCreditsForTargetMargin(0.02),
  },
  'veo-video': {
    id: 'veo-video',
    label: 'Veo video render',
    estimatedCostUsd: 0.45,
    creditsRequired: requiredCreditsForTargetMargin(0.45),
  },
};

export const ACTIVE_PRICING_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 25,
    priceInCents: 900,
    description: 'Perfect for testing the workflow without committing to a large pack.',
    features: [
      '25 credits',
      'Standard promo generation: 1 credit',
      `Veo video render: ${FEATURE_PRICING['veo-video'].creditsRequired} credits`,
      'Credits never expire',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    priceInCents: 2900,
    description: 'Best value for regular creative production.',
    popular: true,
    badge: 'MOST POPULAR',
    originalPriceInCents: 3600,
    savings: '19%',
    features: [
      '100 credits',
      'Standard promo generation: 1 credit',
      `Veo video render: ${FEATURE_PRICING['veo-video'].creditsRequired} credits`,
      'Priority generation queue',
      'Credits never expire',
    ],
  },
  agency: {
    id: 'agency',
    name: 'Agency Pack',
    credits: 500,
    priceInCents: 9900,
    description: 'The lowest cost-per-credit tier for teams and repeat usage.',
    badge: 'BEST VALUE',
    originalPriceInCents: 18000,
    savings: '45%',
    features: [
      '500 credits',
      'Standard promo generation: 1 credit',
      `Veo video render: ${FEATURE_PRICING['veo-video'].creditsRequired} credits`,
      'Bulk workflow support',
      'Credits never expire',
    ],
  },
};

export const ACTIVE_PLAN_IDS = Object.keys(ACTIVE_PRICING_PLANS);

export function getPricePerCreditUsd(planId) {
  const plan = ACTIVE_PRICING_PLANS[planId];
  return plan.priceInCents / 100 / plan.credits;
}

export function getLowestRevenuePerCreditUsd() {
  return Math.min(...ACTIVE_PLAN_IDS.map((planId) => getPricePerCreditUsd(planId)));
}

export function formatPricePerCredit(planId) {
  return `$${getPricePerCreditUsd(planId).toFixed(2)}`;
}