import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.json({ 
    status: 'ok', 
    configured: false,
    hasApiKey: false,
    demoMode: process.env.DEMO_MODE === 'true',
    version: '1.0.0'
  });
}
