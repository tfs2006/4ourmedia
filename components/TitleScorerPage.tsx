import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Copy, Check, Loader2,
  Sparkles, Lock, Gauge,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { getSession } from '../services/supabase';
import { scoreTitle, type TitleScoreResult } from '../lib/titleScorer';
import { FEATURE_PRICING } from '../lib/pricing';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const SHORTS_PACK_URL = 'https://shorts-pack-david-j-woodburys-projects.vercel.app/';
const CREDITS_PER_SCORE = FEATURE_PRICING['title-score'].creditsRequired;

interface TitleScorerPageProps {
  onBack: () => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-300';
  if (score >= 55) return 'text-amber-300';
  return 'text-rose-300';
}

function ringColor(score: number): string {
  if (score >= 80) return '#34d399';
  if (score >= 55) return '#fbbf24';
  return '#fb7185';
}

function ScoreDial({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={radius} fill="none"
          stroke={ringColor(score)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${scoreColor(score)}`}>{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">score</span>
      </div>
    </div>
  );
}

function scoreVerdict(score: number): string {
  if (score >= 85) return 'Viral-ready. This title has strong hooks.';
  if (score >= 70) return 'Solid. A few tweaks could make it great.';
  if (score >= 55) return 'Average. The suggestions below will lift it.';
  if (score >= 30) return 'Weak. Pick one of the rewrites below.';
  return 'Needs work. Start from a rewrite below.';
}

export default function TitleScorerPage({
  onBack, user, creditsRemaining, onRequireAuth, onRequirePurchase, onCreditsUpdated,
}: TitleScorerPageProps) {
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<TitleScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeUsed, setFreeUsed] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function scoreOnServer(value: string): Promise<boolean> {
    const session = await getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`${API_BASE}/api/analyze?op=score-title`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: value }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || data.requiresAuth) {
      onRequireAuth();
      return false;
    }
    if (response.status === 402 || data.insufficientCredits) {
      onRequirePurchase();
      return false;
    }
    if (!response.ok) {
      throw new Error(data.error || 'Scoring failed. Try again.');
    }
    if (typeof data.remainingCredits === 'number') onCreditsUpdated(data.remainingCredits);
    setResult({ score: data.score, breakdown: data.breakdown, suggestions: data.suggestions });
    return true;
  }

  async function handleScore() {
    const value = title.trim();
    if (!value || loading) return;
    setError('');
    setLoading(true);
    try {
      if (user) {
        await scoreOnServer(value);
      } else {
        // Signed-out visitors get one free score, computed locally in the
        // browser. No credits, no server cost. Sign in unlocks unlimited.
        setResult(scoreTitle(value));
        setFreeUsed(true);
      }
    } catch (e: any) {
      setError(e.message || 'Scoring failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function copySuggestion(text: string, index: number) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1500);
  }

  const signedOutLocked = !user && freeUsed;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pg-bg" />
      <div className="relative mx-auto max-w-3xl px-4 py-8 md:py-12">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
            <Gauge className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
            Viral Title <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Scorer</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-slate-400">
            Paste any YouTube title and get an instant 0 to 100 score with a rule-by-rule
            breakdown, plus three rewritten titles built from proven headline formulas.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {user
              ? `${CREDITS_PER_SCORE} credit per score. You have ${creditsRemaining} credits.`
              : 'Your first score is free. Sign in for unlimited scoring.'}
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-2xl shadow-black/30">
          <label htmlFor="title-input" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Your video title
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleScore(); }}
              placeholder="e.g. I Studied a 1.1M-View AI Short. Here Is the Exact Formula."
              maxLength={200}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
            />
            <button
              onClick={handleScore}
              disabled={loading || !title.trim() || signedOutLocked}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Scoring' : signedOutLocked ? 'Sign in to continue' : 'Score it'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {signedOutLocked && (
            <button
              onClick={onRequireAuth}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
            >
              <Lock className="h-4 w-4" /> Sign in free to score unlimited titles
            </button>
          )}
        </div>

        {result && (
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
              <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
                <ScoreDial score={result.score} />
                <div className="text-center md:text-left">
                  <p className={`text-xl font-bold ${scoreColor(result.score)}`}>{scoreVerdict(result.score)}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Scored on 8 headline rules from the great direct-response copywriters:
                    length, numbers, curiosity gap, power words, bracket hooks,
                    benefit clarity, specificity, and craft.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Rule breakdown</h2>
              <ul className="space-y-3">
                {result.breakdown.map((rule) => {
                  const hit = rule.score >= 70;
                  const partial = rule.score >= 35 && rule.score < 70;
                  return (
                    <li key={rule.id} className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                          {hit
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            : partial
                              ? <AlertTriangle className="h-4 w-4 text-amber-400" />
                              : <AlertTriangle className="h-4 w-4 text-rose-400" />}
                          {rule.label}
                        </span>
                        <span className={`text-sm font-bold ${hit ? 'text-emerald-300' : partial ? 'text-amber-300' : 'text-rose-300'}`}>
                          +{rule.points}<span className="text-slate-500">/{rule.weight}</span>
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{rule.tip}</p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
              <h2 className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Rewritten for you</h2>
              <p className="mb-4 text-xs text-slate-500">Three rewrites from proven headline templates, each re-scored.</p>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/60 p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-100">{s.title}</p>
                      <p className={`mt-1 text-xs font-bold ${scoreColor(s.score)}`}>Scores {s.score}/100</p>
                    </div>
                    <button
                      onClick={() => copySuggestion(s.title, i)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                    >
                      {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-white/5 pt-4 text-xs leading-relaxed text-slate-500">
                Writing titles for the 30-Day Viral Shorts Pack? The pack includes 30 ready-made
                titles with hashtags.{' '}
                <a href={SHORTS_PACK_URL} target="_blank" rel="noreferrer" className="font-semibold text-violet-300 hover:text-violet-200">
                  Get the pack here.
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
