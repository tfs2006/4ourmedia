import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Copy, Check, Loader2, Lock, Clapperboard, Search, X,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { getSession } from '../services/supabase';
import { buildScript, type ScriptBuildResult, type ScriptTone } from '../lib/scriptBuilder';
import { HOOKS } from '../lib/hookLibrary';
import { FEATURE_PRICING } from '../lib/pricing';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const CREDITS_PER_BUILD = FEATURE_PRICING['script-build'].creditsRequired;

interface ScriptBuilderPageProps {
  onBack: () => void;
  onOpenTool?: (view: string) => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

const TONES: { id: ScriptTone; label: string; hint: string }[] = [
  { id: 'direct', label: 'Direct', hint: 'No fluff, just the steps' },
  { id: 'funny', label: 'Funny', hint: 'Playful and punchy' },
  { id: 'curiosity', label: 'Curiosity', hint: 'Open loops that pull' },
];

function timingFor(label: string, result: ScriptBuildResult): string {
  const t = result.timing.find((x) => x.label === label);
  return t ? t.range : '';
}

export default function ScriptBuilderPage({
  onBack, onOpenTool, user, creditsRemaining, onRequireAuth, onRequirePurchase, onCreditsUpdated,
}: ScriptBuilderPageProps) {
  const [topic, setTopic] = useState('');
  const [hookQuery, setHookQuery] = useState('');
  const [selectedHook, setSelectedHook] = useState('');
  const [customHook, setCustomHook] = useState('');
  const [lengthSec, setLengthSec] = useState<30 | 60>(30);
  const [tone, setTone] = useState<ScriptTone>('direct');
  const [result, setResult] = useState<ScriptBuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeUsed, setFreeUsed] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hookMatches = useMemo(() => {
    const q = hookQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return HOOKS.filter(
      (h) =>
        h.text.toLowerCase().includes(q) ||
        h.niche.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [hookQuery]);

  const effectiveHook = customHook.trim() || selectedHook;
  const signedOutLocked = !user && freeUsed;

  async function buildOnServer(payload: { topic: string; hook: string; lengthSec: 30 | 60; tone: ScriptTone }): Promise<boolean> {
    const session = await getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`${API_BASE}/api/analyze?op=build-script`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
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
      throw new Error(data.error || 'Script build failed. Try again.');
    }
    if (typeof data.remainingCredits === 'number') onCreditsUpdated(data.remainingCredits);
    setResult(data.script as ScriptBuildResult);
    return true;
  }

  async function handleBuild() {
    const cleanTopic = topic.trim();
    if (!cleanTopic || !effectiveHook || loading) return;
    setError('');
    setLoading(true);
    try {
      const payload = { topic: cleanTopic, hook: effectiveHook, lengthSec, tone };
      if (user) {
        await buildOnServer(payload);
      } else {
        // Signed-out visitors get one free script, computed locally in the
        // browser. No credits, no server cost. Sign in unlocks unlimited.
        setResult(buildScript(payload));
        setFreeUsed(true);
      }
    } catch (e: any) {
      setError(e.message || 'Script build failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  function fullScriptText(): string {
    if (!result) return '';
    const lines: string[] = [];
    for (const s of result.sections) {
      const range = timingFor(s.label, result);
      lines.push(`${s.label}${range ? ` (${range})` : ''}`);
      lines.push(s.text);
      lines.push('');
    }
    lines.push(`Suggested title: ${result.title}`);
    lines.push(`Hashtags: ${result.hashtags.join(' ')}`);
    return lines.join('\n');
  }

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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
            <Clapperboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
            Viral <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Script Builder</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-slate-400">
            Pick a hook, set the length and tone, and get a complete short-form script:
            hook, setup, three escalating beats, payoff, and CTA, with timing for every line.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {user
              ? `${CREDITS_PER_BUILD} credit per script. You have ${creditsRemaining} credits.`
              : 'Your first script is free. Sign in for unlimited scripts.'}
          </p>
        </div>

        <div className="mt-8 space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-2xl shadow-black/30">
          <div>
            <label htmlFor="sb-topic" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Video topic or title
            </label>
            <input
              id="sb-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. sourdough starter for beginners"
              maxLength={120}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label htmlFor="sb-hook-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Hook, from the Hook Swipe File
            </label>
            {selectedHook && !customHook.trim() ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-100">{selectedHook}</p>
                <button
                  onClick={() => { setSelectedHook(''); setHookQuery(''); }}
                  className="shrink-0 rounded-lg p-1 text-amber-300 hover:bg-amber-500/20"
                  aria-label="Clear selected hook"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  id="sb-hook-search"
                  value={hookQuery}
                  onChange={(e) => setHookQuery(e.target.value)}
                  placeholder="Search 561 proven hooks, e.g. curiosity"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
                />
                {hookMatches.length > 0 && (
                  <ul className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl shadow-black/50">
                    {hookMatches.map((h, i) => (
                      <li key={i}>
                        <button
                          onClick={() => { setSelectedHook(h.text); setHookQuery(''); }}
                          className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5"
                        >
                          {h.text}
                          <span className="mt-0.5 block text-[11px] text-slate-500">{h.niche} · {h.type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <label htmlFor="sb-hook-custom" className="mb-2 mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Or write your own hook
            </label>
            <textarea
              id="sb-hook-custom"
              value={customHook}
              onChange={(e) => setCustomHook(e.target.value)}
              placeholder="Your opening line, said in the first 3 seconds"
              maxLength={200}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Length</span>
              <div className="flex gap-2">
                {([30, 60] as const).map((secs) => (
                  <button
                    key={secs}
                    onClick={() => setLengthSec(secs)}
                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      lengthSec === secs
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                        : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {secs}s short
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tone</span>
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    title={t.hint}
                    className={`flex-1 rounded-xl border px-2 py-3 text-sm font-bold transition ${
                      tone === t.id
                        ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                        : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleBuild}
            disabled={loading || !topic.trim() || !effectiveHook || signedOutLocked}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-amber-600/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
            {loading ? 'Building' : signedOutLocked ? 'Sign in to continue' : 'Build my script'}
          </button>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {signedOutLocked && (
            <button
              onClick={onRequireAuth}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
            >
              <Lock className="h-4 w-4" /> Sign in free to build unlimited scripts
            </button>
          )}
        </div>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Your script</h2>
              <button
                onClick={() => copyText(fullScriptText(), 'full')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
              >
                {copiedKey === 'full' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === 'full' ? 'Copied' : 'Copy full script'}
              </button>
            </div>
            {result.sections.map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      {s.label}
                    </span>
                    <span className="text-xs text-slate-500">{timingFor(s.label, result)}</span>
                  </div>
                  <button
                    onClick={() => copyText(s.text, `sec-${i}`)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10"
                  >
                    {copiedKey === `sec-${i}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === `sec-${i}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-100">{s.text}</p>
                <p className="mt-1.5 text-xs text-slate-500">{s.note}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Suggested title</h3>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-100">{result.title}</p>
                <button
                  onClick={() => copyText(result.title, 'title')}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10"
                >
                  {copiedKey === 'title' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === 'title' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Hashtags</h3>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-sm text-sky-300">{result.hashtags.join(' ')}</p>
                <button
                  onClick={() => copyText(result.hashtags.join(' '), 'tags')}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10"
                >
                  {copiedKey === 'tags' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  {copiedKey === 'tags' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {onOpenTool && (
              <p className="border-t border-white/5 pt-4 text-xs leading-relaxed text-slate-500">
                Want a stronger hook next time? The Hook Swipe File has 561 proven openers
                tagged by principle.{' '}
                <button onClick={() => onOpenTool('hook-library')} className="font-semibold text-amber-300 hover:text-amber-200">
                  Open the Hook Swipe File.
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
