import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ACTIVE_PLAN_IDS, ACTIVE_PRICING_PLANS, formatPricePerCredit } from '../../lib/pricing';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.json({
    available: !!process.env.STRIPE_SECRET_KEY,
    tiers: Object.fromEntries(
      ACTIVE_PLAN_IDS.map((planId) => {
        const plan = ACTIVE_PRICING_PLANS[planId];
        return [planId, {
          name: plan.name,
          credits: plan.credits,
          price: plan.priceInCents / 100,
          perCredit: Number(formatPricePerCredit(plan.id).replace('$', '')),
        }];
      })
    )
  });
}
