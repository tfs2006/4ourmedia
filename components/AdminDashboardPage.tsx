import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  DollarSign,
  Gauge,
  KeyRound,
  Loader2,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ADMIN_SECRET_STORAGE_KEY, clearAdminSession, grantAdminSession, hasAdminSessionAccess } from '../lib/adminSession';
import { getSession } from '../services/supabase';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface EndpointStats {
  endpoint: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  creditsCharged: number;
  estimatedCost: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  estimatedMargin: number | null;
}

interface AdminStatsResponse {
  success: boolean;
  timestamp: string;
  viewer?: {
    email: string | null;
    userId: string;
  };
  usage: {
    dailyCalls: number;
    monthlyCalls: number;
    estimatedCost: number;
    estimatedRevenue: number;
    estimatedProfit: number;
    estimatedMargin: number | null;
    totalCreditsCharged: number;
    limitReached: boolean;
    byEndpoint: EndpointStats[];
  } | null;
  limits: {
    globalMonthly: number;
    globalDaily: number;
    ipPerMinute: number;
    userPerMinute: number;
  };
  killSwitch: boolean;
  strictCors: boolean;
  alertThresholds: {
    warningAt: string;
    criticalAt: string;
  };
}

interface StatCardProps {
  label: string;
  value: string;
  helper: string;
  tone: 'violet' | 'emerald' | 'amber' | 'sky';
  icon: React.ComponentType<{ className?: string }>;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function formatEndpointName(endpoint: string) {
  return endpoint
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toneClasses(tone: StatCardProps['tone']) {
  if (tone === 'emerald') return 'from-emerald-500/15 to-emerald-400/5 border-emerald-500/20 text-emerald-300';
  if (tone === 'amber') return 'from-amber-500/15 to-amber-400/5 border-amber-500/20 text-amber-300';
  if (tone === 'sky') return 'from-sky-500/15 to-sky-400/5 border-sky-500/20 text-sky-300';
  return 'from-violet-500/15 to-indigo-500/5 border-violet-500/20 text-violet-300';
}

function StatCard({ label, value, helper, tone, icon: Icon }: StatCardProps) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${toneClasses(tone)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-400">{helper}</p>
        </div>
        <div className="rounded-2xl bg-slate-950/40 p-3">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardPageProps {
  onBack: () => void;
  onAccessGranted?: () => void;
  onAccessRevoked?: () => void;
}

export default function AdminDashboardPage({ onBack, onAccessGranted, onAccessRevoked }: AdminDashboardPageProps) {
  const [adminSecret, setAdminSecret] = useState(() => sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY) || '');
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(() => hasAdminSessionAccess());

  const canLoad = adminSecret.trim().length > 0;

  const loadStats = async (secretOverride?: string) => {
    const secret = (secretOverride ?? adminSecret).trim();
    if (!secret) {
      setError('Enter your admin secret to load profitability data.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await getSession();
      const headers: Record<string, string> = {
        'x-admin-secret': secret,
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers,
      });
      const data = await response.json().catch(() => ({ error: 'Request failed' }));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load admin stats');
      }

      grantAdminSession(secret);
      setHasAccess(true);
      onAccessGranted?.();
      setStats(data as AdminStatsResponse);
    } catch (fetchError: any) {
      setStats(null);
      clearAdminSession();
      setHasAccess(false);
      onAccessRevoked?.();
      setError(fetchError?.message || 'Failed to load admin stats');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminSecret.trim()) {
      loadStats(adminSecret);
    }
  }, []);

  const topEndpoint = useMemo(() => stats?.usage?.byEndpoint?.[0] || null, [stats]);

  const handleClearAccess = () => {
    clearAdminSession();
    setAdminSecret('');
    setStats(null);
    setHasAccess(false);
    setError(null);
    onAccessRevoked?.();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pg-bg" />
      <div className="relative min-h-screen">
        <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Admin Dashboard</p>
                <h1 className="text-2xl font-bold font-display text-white">Profitability Monitor</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-400">
              <Shield className="h-4 w-4 text-emerald-400" />
                Secret plus allowlisted admin auth
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Secure Access</p>
                  <h2 className="mt-2 text-2xl font-bold">Load live billing telemetry</h2>
                  <p className="mt-2 max-w-2xl text-sm text-slate-400">
                    This pulls the existing admin stats endpoint and summarizes credits charged, estimated revenue, estimated cost, and feature margin from the telemetry you just wired into the backend. The request now requires both the admin secret and an approved signed-in admin account.
                  </p>
                </div>
                <div className="hidden rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-violet-300 md:block">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <label className="flex-1">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin Secret</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 focus-within:border-violet-500">
                    <KeyRound className="h-4 w-4 text-violet-300" />
                    <input
                      type="password"
                      value={adminSecret}
                      onChange={(event) => setAdminSecret(event.target.value)}
                      placeholder="Enter ADMIN_SECRET"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                </label>
                <div className="flex items-end gap-3">
                  <button
                    onClick={() => loadStats()}
                    disabled={isLoading || !canLoad}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {isLoading ? 'Loading...' : 'Refresh Stats'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">System Flags</p>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="text-slate-400">Kill switch</span>
                  <span className={`font-semibold ${stats?.killSwitch ? 'text-rose-300' : 'text-emerald-300'}`}>{stats?.killSwitch ? 'Enabled' : 'Normal'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
                  <span className="text-slate-400">Strict CORS</span>
                  <span className={`font-semibold ${stats?.strictCors ? 'text-sky-300' : 'text-slate-300'}`}>{stats?.strictCors ? 'Enabled' : 'Wildcard'}</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current limits</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <p className="text-xs text-slate-500">Daily</p>
                      <p className="text-lg font-bold">{stats?.limits.globalDaily ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Monthly</p>
                      <p className="text-lg font-bold">{stats?.limits.globalMonthly ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">IP / min</p>
                      <p className="text-lg font-bold">{stats?.limits.ipPerMinute ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">User / min</p>
                      <p className="text-lg font-bold">{stats?.limits.userPerMinute ?? '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Authenticated viewer</p>
                  <p className="mt-2 text-sm text-slate-300">{stats?.viewer?.email || 'Not loaded yet'}</p>
                  <p className="mt-1 text-xs text-slate-500">Only allowlisted admin accounts can load this dashboard.</p>
                </div>
              </div>
            </div>
          </section>

          {!hasAccess && (
            <section className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
              <Shield className="mx-auto h-10 w-10 text-slate-600" />
              <h2 className="mt-4 text-xl font-bold text-white">Admin access is locked</h2>
              <p className="mt-2 text-sm text-slate-400">Regular users cannot browse this dashboard from the app. Sign in with an allowlisted admin account and enter the admin secret above to unlock this session.</p>
            </section>
          )}

          {hasAccess && stats?.usage && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard
                  label="Monthly Revenue"
                  value={formatUsd(stats.usage.estimatedRevenue)}
                  helper={`${stats.usage.monthlyCalls} tracked calls this month`}
                  tone="emerald"
                  icon={DollarSign}
                />
                <StatCard
                  label="Monthly Cost"
                  value={formatUsd(stats.usage.estimatedCost)}
                  helper="Estimated backend generation cost"
                  tone="amber"
                  icon={Gauge}
                />
                <StatCard
                  label="Estimated Profit"
                  value={formatUsd(stats.usage.estimatedProfit)}
                  helper="Revenue minus estimated cost"
                  tone="violet"
                  icon={TrendingUp}
                />
                <StatCard
                  label="Gross Margin"
                  value={formatPercent(stats.usage.estimatedMargin)}
                  helper="Blended margin across billed features"
                  tone="sky"
                  icon={BarChart3}
                />
                <StatCard
                  label="Credits Charged"
                  value={String(stats.usage.totalCreditsCharged)}
                  helper={`${stats.usage.dailyCalls} calls in the last day`}
                  tone="violet"
                  icon={Zap}
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Endpoint Breakdown</p>
                      <h2 className="mt-2 text-2xl font-bold">Where the margin comes from</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleClearAccess}
                        className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                      >
                        Lock Dashboard
                      </button>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                        Updated {new Date(stats.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        <tr>
                          <th className="pb-3 pr-4 font-semibold">Endpoint</th>
                          <th className="pb-3 pr-4 font-semibold">Calls</th>
                          <th className="pb-3 pr-4 font-semibold">Credits</th>
                          <th className="pb-3 pr-4 font-semibold">Revenue</th>
                          <th className="pb-3 pr-4 font-semibold">Cost</th>
                          <th className="pb-3 pr-4 font-semibold">Profit</th>
                          <th className="pb-3 font-semibold">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.usage.byEndpoint.map((entry) => (
                          <tr key={entry.endpoint} className="border-t border-slate-800 text-slate-300">
                            <td className="py-4 pr-4">
                              <div>
                                <p className="font-semibold text-white">{formatEndpointName(entry.endpoint)}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {entry.successfulCalls} success / {entry.failedCalls} failed
                                </p>
                              </div>
                            </td>
                            <td className="py-4 pr-4 font-semibold">{entry.totalCalls}</td>
                            <td className="py-4 pr-4 font-semibold">{entry.creditsCharged}</td>
                            <td className="py-4 pr-4 font-semibold text-emerald-300">{formatUsd(entry.estimatedRevenue)}</td>
                            <td className="py-4 pr-4 text-amber-300">{formatUsd(entry.estimatedCost)}</td>
                            <td className="py-4 pr-4 font-semibold text-white">{formatUsd(entry.estimatedProfit)}</td>
                            <td className="py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${entry.estimatedMargin !== null && entry.estimatedMargin >= 0.8 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                                {formatPercent(entry.estimatedMargin)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Top Earner</p>
                    {topEndpoint ? (
                      <div className="mt-4 rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/10 to-slate-950/40 p-5">
                        <p className="text-lg font-bold text-white">{formatEndpointName(topEndpoint.endpoint)}</p>
                        <p className="mt-2 text-sm text-slate-400">
                          {topEndpoint.totalCalls} calls generated {formatUsd(topEndpoint.estimatedRevenue)} in estimated revenue.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                            <p className="text-xs text-slate-500">Profit</p>
                            <p className="mt-1 font-bold text-white">{formatUsd(topEndpoint.estimatedProfit)}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
                            <p className="text-xs text-slate-500">Margin</p>
                            <p className="mt-1 font-bold text-white">{formatPercent(topEndpoint.estimatedMargin)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-400">No endpoint data has been logged yet.</p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Operational Notes</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-400">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        Revenue is estimated from credits charged at the lowest active revenue-per-credit tier, which keeps the dashboard conservative.
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        Failed requests still appear in endpoint totals, but only successful requests contribute estimated revenue and cost.
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        Use this page to verify your real feature mix still stays above the 80% margin target as usage patterns change.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {!hasAccess && !isLoading && !error && (
            <></>
          )}

          {hasAccess && !stats?.usage && !isLoading && !error && (
            <section className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
              <Shield className="mx-auto h-10 w-10 text-slate-600" />
              <h2 className="mt-4 text-xl font-bold text-white">Enter your admin secret to load the dashboard</h2>
              <p className="mt-2 text-sm text-slate-400">The data stays behind the existing secret-protected stats endpoint. This page is only a visual layer on top of it.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}