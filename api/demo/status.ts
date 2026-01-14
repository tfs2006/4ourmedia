import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_GENERATIONS = 3;

// Session tracking (in-memory, resets on cold starts)
const sessionUsage = new Map<string, { generationsUsed: number }>();

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-session-id');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sessionId = (req.headers['x-session-id'] as string) || generateSessionId();
  const usage = sessionUsage.get(sessionId) || { generationsUsed: 0 };
  
  res.json({
    sessionId,
    generationsUsed: usage.generationsUsed,
    remaining: Math.max(0, MAX_GENERATIONS - usage.generationsUsed),
    maxGenerations: MAX_GENERATIONS,
    demoMode: process.env.DEMO_MODE === 'true'
  });
}
