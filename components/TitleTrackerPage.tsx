import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Plus, Trash2, Trophy, Loader2, Lock, FlaskConical,
  Search, Copy, Check,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { getSession, supabase } from '../services/supabase';
import { FEATURE_PRICING } from '../lib/pricing';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const CREDITS_PER_VERDICT = FEATURE_PRICING['declare-winner'].creditsRequired;

interface TitleTrackerPageProps {
  onBack: () => void;
  onOpenTool?: (view: string) => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

interface TitleTest {
  id: string;
  video_name: string;
  title: string;
  ctr: number | null;
  impressions: number | null;
  note: string | null;
  created_at: string;
}

interface Verdict {
  winner: string;
  winnerCtr: number | null;
  significant: boolean;
  reason: string;
}

export default function TitleTrackerPage({
  onBack, onOpenTool, user, creditsRemaining, onRequireAuth, onRequirePurchase, onCreditsUpdated,
}: TitleTrackerPageProps) {
  const [tests, setTests] = useState<TitleTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoName, setVideoName] = useState('');
  const [title, setTitle] = useState('');
  const [ctr, setCtr] = useState('');
  const [impressions, setImpressions] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const [verdictLoading, setVerdictLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error: fetchError } = await supabase
        .from('title_tests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fetchError && data) setTests(data as TitleTest[]);
      setLoading(false);
    })();
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!videoName.trim() || !title.trim()) {
      setError('Video name and title variant are required.');
      return;
    }
    setError('');
    setSaving(true);
    const { data, error: insertError } = await supabase
      .from('title_tests')
      .insert({
        user_id: user.id,
        video_name: videoName.trim(),
        title: title.trim(),
        ctr: ctr.trim() ? Number(ctr) : null,
        impressions: impressions.trim() ? parseInt(impressions, 10) : null,
        note: note.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (insertError) {
      setError('Could not save the test. Try again.');
      return;
    }
    setTests((prev) => [data as TitleTest, ...prev]);
    setVideoName('');
    setTitle('');
    setCtr('');
    setImpressions('');
    setNote('');
  }

  async function handleDelete(id: string) {
    const { error: delError } = await supabase.from('title_tests').delete().eq('id', id);
    if (!delError) setTests((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleVerdict(video: string) {
    if (!user) {
      onRequireAuth();
      return;
    }
    setVerdictLoading(video);
    setError('');
    try {
      const session = await getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const response = await fetch(`${API_BASE}/api/analyze?op=declare-winner`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ video_name: video }),
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
      if (!response.ok) throw new Error(data.error || 'Verdict failed. Try again.');
      if (typeof data.remainingCredits === 'number') onCreditsUpdated(data.remainingCredits);
      setVerdicts((prev) => ({ ...prev, [video]: data.verdict }));
    } catch (e: any) {
      setError(e.message || 'Verdict failed. Try again.');
    } finally {
      setVerdictLoading(null);
    }
  }

  function copyTitle(text: string, id: string) {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1500);
  }

  const videos = useMemo(() => {
    const map = new Map<string, TitleTest[]>();
    for (const t of tests) {
      const list = map.get(t.video_name) || [];
      list.push(t);
      map.set(t.video_name, list);
    }
    return [...map.entries()];
  }, [tests]);

  const swipeFile = useMemo(() => {
    const best = new Map<string, TitleTest>();
    for (const t of tests) {
      if (t.ctr == null) continue;
      const cur = best.get(t.video_name);
      if (!cur || (cur.ctr ?? -1) < t.ctr) best.set(t.video_name, t);
    }
    let list = [...best.values()];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || t.video_name.toLowerCase().includes(q));
    return list.sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0));
  }, [tests, search]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="pg-bg" />
        <div className="relative mx-auto max-w-3xl px-4 py-8 md:py-12">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-10 text-center">
            <FlaskConical className="mx-auto mb-4 h-10 w-10 text-violet-400" />
            <h1 className="text-2xl font-black">Title Test Tracker</h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
              Log every title you test with its real CTR, get a statistical verdict on the winner,
              and build a personal swipe file of what works for your audience.
            </p>
            <button
              onClick={onRequireAuth}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110"
            >
              <Lock className="h-4 w-4" /> Sign in free to start tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pg-bg" />
      <div className="relative mx-auto max-w-4xl px-4 py-8 md:py-12">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
            <FlaskConical className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
            Title <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Test Tracker</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-slate-400">
            Log every title variant with its real CTR from YouTube Studio. Get a verdict on the
            winner and build your personal swipe file.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Logging is free. A winner verdict costs {CREDITS_PER_VERDICT} credit. You have {creditsRemaining} credits.
          </p>
        </div>

        <form onSubmit={handleAdd} className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-2xl shadow-black/30">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Log a test</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={videoName} onChange={(e) => setVideoName(e.target.value)}
              placeholder="Video name (e.g. Shorts Pack launch)"
              maxLength={120}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
            />
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Title variant you tested"
              maxLength={200}
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
            />
            <input
              value={ctr} onChange={(e) => setCtr(e.target.value)}
              placeholder="CTR % (e.g. 4.2)" inputMode="decimal"
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
            />
            <input
              value={impressions} onChange={(e) => setImpressions(e.target.value)}
              placeholder="Impressions (e.g. 8500)" inputMode="numeric"
              className="rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional, e.g. tested for 7 days)"
            maxLength={200}
            className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
          />
          <button
            type="submit" disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Saving' : 'Log test (free)'}
          </button>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </form>

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-500">Loading your tests...</p>
        ) : (
          <>
            <div className="mt-10">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Your tests</h2>
              {videos.length === 0 && (
                <p className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-center text-sm text-slate-500">
                  No tests logged yet. Add your first one above.
                </p>
              )}
              <div className="space-y-4">
                {videos.map(([video, variants]) => {
                  const verdict = verdicts[video];
                  return (
                    <div key={video} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/20">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-100">{video}</h3>
                        {variants.length >= 2 && (
                          <button
                            onClick={() => handleVerdict(video)}
                            disabled={verdictLoading === video}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow transition hover:brightness-110 disabled:opacity-40"
                          >
                            {verdictLoading === video ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trophy className="h-3.5 w-3.5" />}
                            {verdictLoading === video ? 'Judging' : `Declare winner (${CREDITS_PER_VERDICT} credit)`}
                          </button>
                        )}
                      </div>
                      <ul className="mt-4 space-y-2">
                        {variants.map((v) => (
                          <li key={v.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-200">{v.title}</p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {v.ctr != null ? `${v.ctr}% CTR` : 'no CTR yet'}
                                {v.impressions != null ? `, ${v.impressions.toLocaleString()} impressions` : ''}
                                {v.note ? `, ${v.note}` : ''}
                              </p>
                            </div>
                            <button onClick={() => handleDelete(v.id)} className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-rose-300" aria-label="Delete test">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      {verdict && (
                        <div className={`mt-4 rounded-2xl border p-4 ${verdict.significant ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                          <p className="flex items-center gap-2 text-sm font-bold text-slate-100">
                            <Trophy className={`h-4 w-4 ${verdict.significant ? 'text-emerald-400' : 'text-amber-400'}`} />
                            Winner: {verdict.winner}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-400">{verdict.reason}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Your swipe file</h2>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search winners"
                    className="rounded-xl border border-white/10 bg-slate-950/80 py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-violet-500/60"
                  />
                </div>
              </div>
              {swipeFile.length === 0 ? (
                <p className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-center text-sm text-slate-500">
                  Your best-performing titles will appear here once you log tests with CTR data.
                </p>
              ) : (
                <ul className="space-y-2">
                  {swipeFile.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">{t.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{t.video_name}, {t.ctr}% CTR</p>
                      </div>
                      <button
                        onClick={() => copyTitle(t.title, t.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                      >
                        {copiedId === t.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === t.id ? 'Copied' : 'Copy'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {onOpenTool && (
              <button
                onClick={() => onOpenTool('upload-auditor')}
                className="mt-10 w-full rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-5 text-left transition hover:bg-emerald-500/10"
              >
                <p className="text-sm font-bold text-slate-100">Got a winner? Protect the next upload.</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  A great title still flops with a weak description. Run your next video through the Upload Auditor before you publish.
                </p>
                <span className="mt-2 inline-block text-xs font-bold text-emerald-300">Open the Upload Auditor</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
