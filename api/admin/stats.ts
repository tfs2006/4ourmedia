import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminStats, getCorsHeaders } from '../lib/api-safety';

/**
 * Admin endpoint to check API usage stats
 * Protected by admin secret
 * 
 * Usage: GET /api/admin/stats?secret=YOUR_ADMIN_SECRET
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  const corsHeaders = getCorsHeaders(origin);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check - require admin secret
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = req.query.secret || req.headers['x-admin-secret'];
  
  if (!adminSecret || providedSecret !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stats = await getAdminStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...stats,
      alertThresholds: {
        warningAt: '80% of limits',
        criticalAt: '95% of limits'
      }
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
}
