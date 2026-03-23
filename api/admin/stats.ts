import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hasConfiguredAdminAllowlist, isAuthorizedAdmin } from '../../lib/adminAccess';
import { getAdminStats, getCorsHeaders } from '../lib/api-safety';
import { verifyAuthenticatedUser } from '../../lib/serverBilling';

/**
 * Admin endpoint to check API usage stats
 * Protected by admin secret + authenticated allowlisted admin user
 * 
 * Required env: ADMIN_SECRET plus ADMIN_EMAILS or ADMIN_USER_IDS
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

  if (!hasConfiguredAdminAllowlist()) {
    return res.status(503).json({ error: 'Admin allowlist is not configured. Set ADMIN_EMAILS or ADMIN_USER_IDS.' });
  }

  const authenticatedUser = await verifyAuthenticatedUser(req.headers as Record<string, any>);
  if (!authenticatedUser) {
    return res.status(401).json({ error: 'Sign in required for admin access.' });
  }

  if (!isAuthorizedAdmin(authenticatedUser)) {
    return res.status(403).json({ error: 'This account is not approved for admin access.' });
  }

  try {
    const stats = await getAdminStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      viewer: {
        email: authenticatedUser.email || null,
        userId: authenticatedUser.id,
      },
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
