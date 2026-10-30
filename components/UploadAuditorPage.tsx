import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Info, XCircle, Loader2,
  ClipboardCheck, Lock,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { getSession } from '../services/supabase';
import { auditUpload, type AuditResult } from '../lib/uploadAudit';
import { FEATURE_PRICING } from '../lib/pricing';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const CREDITS_PER_AUDIT = FEATURE_PRICING['upload-audit'].creditsRequired;

interface UploadAuditorPageProps {
  onBack: () => void;
  onOpenTool?: (view: string) => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

function statusIcon(status: string) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  if (status === 'fail') return <XCircle className="h-4 w-4 text-rose-400" />;
  return <Info className="h-4 w-4 text-sky-400" />;
}

function statusText(status: string) {
  if (status === 'pass') return 'text-emerald-300';
  if (status === 'warn') return 'text-amber-300';
  if (status === 'fail') return 'text-rose-300';
  return 'text-sky-300';
}

export default function UploadAuditorPage({
  onBack, onOpenTool, user, creditsRemaining, onRequireAuth, onRequirePurchase, onCreditsUpdated,
}: UploadAuditorPageProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [pinned, setPinned] = useState(false);
  const [chapters, setChapters] = useState(false);
  const [endScreen, setEndScreen] = useState(false);
  const [cards, setCards] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeUsed, setFreeUsed] = useState(false);

  async function auditOnServer(): Promise<boolean> {
    const session = await getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`${API_BASE}/api/analyze?op=audit-upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, description, tags, pinned, chapters, endScreen, cards }),
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
      throw new Error(data.error || 'Audit failed. Try again.');
    }
    if (typeof data.remainingCredits === 'number') onCreditsUpdated(data.remainingCredits);
    setResult({ verdict: data.verdict, titleScore: data.titleScore, checks: data.checks });
    return true;
  }

  async function handleAudit() {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      if (user) {
        await auditOnServer();
      } else {
        setResult(auditUpload({ title, description, tags, pinned, chapters, endScreen, cards }));
        setFreeUsed(true);
      }
    } catch (e: any) {
      setError(e.message || 'Audit failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const signedOutLocked = !user && freeUsed;
  const boxes: [string, boolean, (v: boolean) => void][] = [
    ['Pinned comment planned', pinned, setPinned],
    ['Chapters added', chapters, setChapters],
    ['End screen added', endScreen, setEndScreen],
    ['Cards added', cards, setCards],
  ];

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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
            <ClipboardCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
            Pre-Publish <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Upload Auditor</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-slate-400">
            Run every video through this before you hit publish. It checks your title,
            description, tags, and upload checklist, then tells you what to fix first.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {user
              ? `${CREDITS_PER_AUDIT} credit per audit. You have ${creditsRemaining} credits.`
              : 'Your first audit is free. Sign in for unlimited audits.'}
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-2xl shadow-black/30 space-y-4">
          <div>
            <label htmlFor="audit-title" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Video title
            </label>
            <input
              id="audit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your video title"
              maxLength={200}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label htmlFor="audit-desc" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Description
            </label>
            <textarea
              id="audit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste your full video description"
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label htmlFor="audit-tags" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tags (comma separated)
            </label>
            <input
              id="audit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. ai shorts, youtube growth, faceless video"
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {boxes.map(([label, checked, set]) => (
              <label key={label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 transition hover:border-white/15">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => set(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                {label}
              </label>
            ))}
          </div>
          <button
            onClick={handleAudit}
            disabled={loading || signedOutLocked}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            {loading ? 'Auditing' : signedOutLocked ? 'Sign in to continue' : 'Audit my upload'}
          </button>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {signedOutLocked && (
            <button
              onClick={onRequireAuth}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <Lock className="h-4 w-4" /> Sign in free for unlimited audits
            </button>
          )}
        </div>

        {result && (
          <div className="mt-6 space-y-6">
            <div className={`rounded-3xl border p-6 text-center shadow-2xl shadow-black/30 ${
              result.verdict === 'ready'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-rose-500/30 bg-rose-500/5'
            }`}>
              <p className={`text-2xl font-black ${result.verdict === 'ready' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {result.verdict === 'ready' ? 'Ready to publish' : 'Fix first'}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {result.verdict === 'ready'
                  ? 'No blocking issues. The warnings below are optional polish.'
                  : 'One or more checks failed. Fix the red items at the top, then publish.'}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Checklist</h2>
              <ul className="space-y-3">
                {result.checks.map((check) => (
                  <li key={check.id} className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                      {statusIcon(check.status)}
                      {check.label}
                      <span className={`ml-auto text-xs font-bold uppercase tracking-wider ${statusText(check.status)}`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{check.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
            {onOpenTool && (
              <button
                onClick={() => onOpenTool('title-tracker')}
                className="w-full rounded-3xl border border-violet-500/25 bg-violet-500/5 p-5 text-left transition hover:bg-violet-500/10"
              >
                <p className="text-sm font-bold text-slate-100">Will the new title actually win?</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Opinions do not rank videos. Log both versions in the Title Test Tracker and let the CTR decide.
                </p>
                <span className="mt-2 inline-block text-xs font-bold text-violet-300">Open the Title Test Tracker</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
