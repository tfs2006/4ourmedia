import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const hasApiKey = Boolean(process.env.DEMO_API_KEY || process.env.GEMINI_API_KEY);
  const hasSupabase = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

  res.json({ 
    status: 'ok', 
    configured: hasApiKey && hasSupabase,
    hasApiKey,
    hasSupabase,
    demoMode: process.env.DEMO_MODE === 'true',
    version: '1.0.0'
  });
}
