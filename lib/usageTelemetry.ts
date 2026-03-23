import { createClient } from '@supabase/supabase-js';
import { FEATURE_PRICING, type FeaturePricingId, getLowestRevenuePerCreditUsd } from './pricing';

type UsageSource = 'vercel-api' | 'express';

export interface UsageTelemetryEvent {
  endpoint: string;
  ipAddress?: string;
  userId?: string;
  success: boolean;
  featureId?: FeaturePricingId;
  creditsCharged?: number;
  remainingCredits?: number;
  refunded?: boolean;
  source?: UsageSource;
  metadata?: Record<string, unknown>;
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function buildTelemetryMetadata(event: UsageTelemetryEvent) {
  const creditsCharged = event.creditsCharged || 0;
  const featurePricing = event.featureId ? FEATURE_PRICING[event.featureId] : null;
  const estimatedCostUsd = event.success && featurePricing ? featurePricing.estimatedCostUsd : 0;
  const estimatedRevenueUsd = event.success && creditsCharged > 0
    ? creditsCharged * getLowestRevenuePerCreditUsd()
    : 0;
  const estimatedProfitUsd = estimatedRevenueUsd - estimatedCostUsd;
  const estimatedMargin = estimatedRevenueUsd > 0
    ? estimatedProfitUsd / estimatedRevenueUsd
    : null;

  return {
    featureId: event.featureId || null,
    creditsCharged,
    remainingCredits: typeof event.remainingCredits === 'number' ? event.remainingCredits : null,
    refunded: event.refunded === true,
    estimatedCostUsd,
    estimatedRevenueUsd,
    estimatedProfitUsd,
    estimatedMargin,
    source: event.source || 'vercel-api',
    ...event.metadata,
  };
}

export async function logUsageTelemetry(event: UsageTelemetryEvent): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return;
  }

  try {
    await supabase.from('api_usage').insert({
      endpoint: event.endpoint,
      ip_address: event.ipAddress || null,
      user_id: event.userId || null,
      success: event.success,
      metadata: buildTelemetryMetadata(event),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging usage telemetry:', error);
  }
}