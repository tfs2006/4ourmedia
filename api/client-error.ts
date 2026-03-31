import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import { logUsageTelemetry } from '../lib/usageTelemetryRuntime.js';

const ipRequests = new Map<string, { count: number; resetTime: number }>();
const IP_LIMIT = 30;

function getClientIP(req: VercelRequest): string {
  return req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.headers['x-real-ip']?.toString() || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + 60000 });
    return { allowed: true };
  }

  if (entry.count >= IP_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength);
}

function firstLine(value: string): string {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)[0] || '';
}

function buildFingerprint(message: string, stack: string, componentStack: string): string {
  const hashInput = `${message}|${firstLine(stack)}|${firstLine(componentStack)}`;
  return createHash('sha256').update(hashInput).digest('hex').slice(0, 16);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.retryAfter));
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  try {
    const message = sanitizeText(req.body?.message, 500);
    const stack = sanitizeText(req.body?.stack, 4000);
    const componentStack = sanitizeText(req.body?.componentStack, 4000);
    const route = sanitizeText(req.body?.route, 300);
    const source = sanitizeText(req.body?.source, 80) || 'react-error-boundary';
    const userAgent = sanitizeText(req.body?.userAgent, 400) || sanitizeText(req.headers['user-agent'], 400);

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const fingerprint = buildFingerprint(message, stack, componentStack);

    await logUsageTelemetry({
      endpoint: 'client-error',
      ipAddress: ip,
      success: false,
      source: 'vercel-api',
      metadata: {
        errorSource: source,
        errorMessage: message,
        errorFingerprint: fingerprint,
        errorRoute: route || null,
        errorStackTop: firstLine(stack) || null,
        errorComponentTop: firstLine(componentStack) || null,
        userAgent: userAgent || null,
      },
    });

    return res.status(202).json({ success: true, fingerprint });
  } catch (error: any) {
    console.error('client-error logging failed:', error);
    return res.status(500).json({ error: 'Failed to record client error' });
  }
}
