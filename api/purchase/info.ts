import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.json({
    available: !!process.env.STRIPE_SECRET_KEY,
    tiers: {
      starter: { name: 'Starter Pack', credits: 25, price: 9, perCredit: 0.36 },
      pro: { name: 'Pro Pack', credits: 100, price: 29, perCredit: 0.29 },
      agency: { name: 'Agency Pack', credits: 500, price: 99, perCredit: 0.20 },
      unlimited: { name: 'Unlimited Monthly', credits: -1, price: 19, isSubscription: true }
    }
  });
}
