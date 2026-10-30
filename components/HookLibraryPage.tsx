import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Search, Copy, Check, Loader2, Lock, BookOpen, Unlock,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { getSession, supabase } from '../services/supabase';
import { HOOKS, HOOK_NICHES, HOOK_TYPES, FREE_HOOK_PREVIEW, type HookType } from '../lib/hookLibrary';
import { FEATURE_PRICING } from '../lib/pricing';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const UNLOCK_COST = FEATURE_PRICING['hook-unlock'].creditsRequired;

interface HookLibraryPageProps {
  onBack: () => void;
  onOpenTool?: (view: string) => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

export default function HookLibraryPage({
  onBack, onOpenTool, user, creditsRemaining, onRequireAuth, onRequirePurchase, onCreditsUpdated,
}: HookLibraryPageProps) {
  const [search, setSearch] = useState('');
  const [niche, setNiche] = useState<string>('all');
  const [type, setType] = useState<'all' | HookType>('all');
  const [unlocked, setUnlocked] = useState(false);
  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showCount, setShowCount] = useState(60);

  useEffect(() => {
    if (!user) {
      setCheckingUnlock(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('hook_unlocks')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        setUnlocked(!!data);
      } catch {
        setUnlocked(false);
      } finally {
        setCheckingUnlock(false);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return HOOKS.filter((h) => {
      if (niche !== 'all' && h.niche !== niche) return false;
      if (type !== 'all' && h.type !== type) return false;
      if (q && !h.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, niche, type]);

  const visible = useMemo(() => {
    if (unlocked) return filtered.slice(0, showCount);
    return filtered.slice(0, FREE_HOOK_PREVIEW);
  }, [filtered, unlocked, showCount]);

  async function handleUnlock() {
    if (!user) {
      onRequireAuth();
      return;
    }
    setUnlocking(true);
    setError('');
    try {
      const session = await getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const response = await fetch(`${API_BASE}/api/analyze?op=unlock-hooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || data.requiresAuth) {
        onRequireAuth();
        return;
      }
      if (response.status === 402 || data.insufficientCredits) {
        onRequirePurchase();
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Unlock failed. Try again.');
      if (typeof data.remainingCredits === 'number') onCreditsUpdated(data.remainingCredits);
      setUnlocked(true);
    } catch (e: any) {
      setError(e.message || 'Unlock failed. Try again.');
    } finally {
      setUnlocking(false);
    }
  }

  function copyHook(text: string, idx: number) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopiedIdx(idx);
    window.setTimeout(() => setCopiedIdx(null), 1500);
  }

  const locked = !unlocked;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pg-bg" />
      <div className="relative mx-auto max-w-4xl px-4 py-8 md:py-12">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
            Hook <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Swipe File</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-slate-400">
            {HOOKS.length} proven video openers, organized by niche and hook type. Each one is
            tagged with the copywriting principle behind it.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            First {FREE_HOOK_PREVIEW} hooks are free to browse.
            {unlocked ? ' Your full library is unlocked.' : ` Unlock all ${HOOKS.length} for ${UNLOCK_COST} credits, one time, yours forever.`}
          </p>
        </div>

        {locked && !checkingUnlock && (
          <div className="mx-auto mt-6 max-w-xl rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
            <p className="text-sm text-slate-300">
              {user
                ? `You have ${creditsRemaining} credits. Unlock the full library once and keep it forever.`
                : 'Sign in to unlock the full library.'}
            </p>
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:brightness-110 disabled:opacity-40"
            >
              {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              {unlocking ? 'Unlocking' : user ? `Unlock all ${HOOKS.length} hooks (${UNLOCK_COST} credits)` : 'Sign in to unlock'}
            </button>
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search} onChange={(e) => { setSearch(e.target.value); setShowCount(60); }}
                placeholder="Search hooks (e.g. procrastination)"
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <select
              value={niche} onChange={(e) => { setNiche(e.target.value); setShowCount(60); }}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/60"
            >
              <option value="all">All niches</option>
              {HOOK_NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <select
              value={type} onChange={(e) => { setType(e.target.value as 'all' | HookType); setShowCount(60); }}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none focus:border-amber-500/60"
            >
              <option value="all">All hook types</option>
              {HOOK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Showing {visible.length} of {filtered.length} matching hooks{locked ? ` (first ${FREE_HOOK_PREVIEW} free)` : ''}.
        </p>

        <ul className="mt-4 space-y-2">
          {visible.map((h, i) => (
            <li key={`${h.text}-${i}`} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/60 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100">"{h.text}"</p>
                <p className="mt-1 text-xs text-slate-500">
                  {h.niche} <span className="text-slate-700">|</span> {HOOK_TYPES.find((t) => t.id === h.type)?.label} <span className="text-slate-700">|</span> {h.principle}
                </p>
              </div>
              <button
                onClick={() => copyHook(h.text, i)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
              >
                {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedIdx === i ? 'Copied' : 'Copy'}
              </button>
            </li>
          ))}
        </ul>

        {locked && filtered.length > FREE_HOOK_PREVIEW && (
          <div className="mt-6 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
            <Lock className="mx-auto mb-2 h-5 w-5 text-amber-400" />
            <p className="text-sm text-slate-300">
              {filtered.length - FREE_HOOK_PREVIEW} more hooks are waiting.
            </p>
            <button onClick={handleUnlock} disabled={unlocking} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-40">
              {unlocking ? 'Unlocking' : `Unlock all (${UNLOCK_COST} credits)`}
            </button>
          </div>
        )}

        {unlocked && visible.length < filtered.length && (
          <button
            onClick={() => setShowCount((c) => c + 120)}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
          >
            Show more ({filtered.length - visible.length} remaining)
          </button>
        )}

        {unlocked && onOpenTool && (
          <button
            onClick={() => onOpenTool('thumbnail-checker')}
            className="mt-6 w-full rounded-3xl border border-sky-500/25 bg-sky-500/5 p-5 text-left transition hover:bg-sky-500/10"
          >
            <p className="text-sm font-bold text-slate-100">The hook earns the click. The thumbnail seals it.</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              A great opener still needs a thumbnail that survives the feed. Preview your safe zones before you publish.
            </p>
            <span className="mt-2 inline-block text-xs font-bold text-sky-300">Open the Thumbnail Checker</span>
          </button>
        )}
      </div>
    </div>
  );
}
