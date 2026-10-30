import React, { useRef, useState } from 'react';
import {
  ArrowLeft, Upload, Loader2, Lock, Image as ImageIcon,
  CheckCircle2, AlertTriangle, XCircle, Eye, EyeOff,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { getSession } from '../services/supabase';
import { FEATURE_PRICING } from '../lib/pricing';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const CREDITS_PER_CHECK = FEATURE_PRICING['thumbnail-check'].creditsRequired;

interface ThumbnailCheckerPageProps {
  onBack: () => void;
  onOpenTool?: (view: string) => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

interface ThumbCheck {
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

function statusIcon(status: string) {
  if (status === 'pass') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  return <XCircle className="h-4 w-4 text-rose-400" />;
}

export default function ThumbnailCheckerPage({
  onBack, onOpenTool, user, creditsRemaining, onRequireAuth, onRequirePurchase, onCreditsUpdated,
}: ThumbnailCheckerPageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [checks, setChecks] = useState<ThumbCheck[] | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [zoneMode, setZoneMode] = useState<'shorts' | 'player'>('shorts');
  const [words, setWords] = useState(false);
  const [focal, setFocal] = useState(false);
  const [face, setFace] = useState(false);
  const [readable, setReadable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [freeUsed, setFreeUsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setError('');
    setChecks(null);
    setFileName(file.name);
    setFileSize(file.size);
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    const probe = new Image();
    probe.onload = () => {
      setNaturalW(probe.naturalWidth);
      setNaturalH(probe.naturalHeight);
      setZoneMode(probe.naturalHeight > probe.naturalWidth ? 'shorts' : 'player');
    };
    probe.src = url;
  }

  function averageLuminance(): number | null {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      return sum / (32 * 32) / 255;
    } catch {
      return null;
    }
  }

  function runChecks() {
    const list: ThumbCheck[] = [];
    const isPortrait = naturalH > naturalW;

    if (isPortrait) {
      if (naturalW >= 1080 && naturalH >= 1920) {
        list.push({ label: 'Dimensions', status: 'pass', detail: `${naturalW}x${naturalH}. Full Shorts resolution.` });
      } else if (naturalW >= 720) {
        list.push({ label: 'Dimensions', status: 'warn', detail: `${naturalW}x${naturalH}. Works, but 1080x1920 looks sharper on phones.` });
      } else {
        list.push({ label: 'Dimensions', status: 'warn', detail: `${naturalW}x${naturalH}. Small. Text may blur on phones. Use 1080x1920.` });
      }
    } else {
      if (naturalW >= 1280 && naturalH >= 720) {
        list.push({ label: 'Dimensions', status: 'pass', detail: `${naturalW}x${naturalH}. Meets the 1280x720 YouTube standard.` });
      } else {
        list.push({ label: 'Dimensions', status: 'warn', detail: `${naturalW}x${naturalH}. Below the 1280x720 standard. Upscale it.` });
      }
    }

    const mb = fileSize / (1024 * 1024);
    list.push({
      label: 'File size', status: mb > 2 ? 'fail' : 'pass',
      detail: mb > 2
        ? `${mb.toFixed(1)}MB. YouTube rejects thumbnails over 2MB. Compress it.`
        : `${mb.toFixed(2)}MB. Under the 2MB YouTube limit.`,
    });

    const lum = averageLuminance();
    if (lum != null) {
      list.push({
        label: 'Brightness', status: lum < 0.16 ? 'warn' : 'pass',
        detail: lum < 0.16
          ? 'Very dark overall. Dark thumbnails get skipped in a bright feed. Lift the subject.'
          : 'Brightness looks healthy for feed visibility.',
      });
    }

    const self: [string, boolean, string][] = [
      ['5 words or fewer', words, 'Short text wins. If you counted more than 5 words, cut it.'],
      ['One clear focal point', focal, 'One subject, one message. Two focal points split attention.'],
      ['Face or strong emotion visible', face, 'Faces with emotion lift CTR. If there is no face, make the object huge.'],
      ['Text readable at phone size', readable, 'Pinch the preview small. If you cannot read it instantly, enlarge the text.'],
    ];
    for (const [label, ticked, detail] of self) {
      list.push({ label, status: ticked ? 'pass' : 'warn', detail: ticked ? 'Confirmed.' : detail });
    }

    setChecks(list);
  }

  async function chargeOnServer(): Promise<boolean> {
    const session = await getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`${API_BASE}/api/analyze?op=thumbnail-check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
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
    if (!response.ok) throw new Error(data.error || 'Check failed. Try again.');
    if (typeof data.remainingCredits === 'number') onCreditsUpdated(data.remainingCredits);
    return true;
  }

  async function handleCheck() {
    if (loading || !objectUrl) return;
    setError('');
    setLoading(true);
    try {
      if (user) {
        const ok = await chargeOnServer();
        if (!ok) return;
      } else {
        setFreeUsed(true);
      }
      runChecks();
    } catch (e: any) {
      setError(e.message || 'Check failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const signedOutLocked = !user && freeUsed;
  const selfBoxes: [string, boolean, (v: boolean) => void][] = [
    ['5 words or fewer on the thumbnail', words, setWords],
    ['One clear focal point', focal, setFocal],
    ['Face or strong emotion visible', face, setFace],
    ['Text readable at phone size', readable, setReadable],
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pg-bg" />
      <div className="relative mx-auto max-w-4xl px-4 py-8 md:py-12">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-500 shadow-lg shadow-sky-500/30">
            <ImageIcon className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight">
            Thumbnail <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">Safe-Zone Preview</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-slate-400">
            Upload a thumbnail and see exactly what YouTube covers up: the Shorts action rail,
            the title area, the progress bar. Your image never leaves your browser.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {user
              ? `${CREDITS_PER_CHECK} credit per check. You have ${creditsRemaining} credits.`
              : 'Your first check is free. Sign in for unlimited checks.'}
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 md:p-6 shadow-2xl shadow-black/30">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />
          {!objectUrl ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-slate-950/60 px-6 py-14 transition hover:border-sky-500/40 hover:bg-slate-950"
            >
              <Upload className="h-8 w-8 text-slate-500" />
              <span className="text-sm font-semibold text-slate-300">Choose a thumbnail image</span>
              <span className="text-xs text-slate-500">Stays on your device. Never uploaded or stored.</span>
            </button>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <img ref={imgRef} src={objectUrl} alt="Thumbnail preview" className="block w-full" />
                  {showZones && zoneMode === 'shorts' && (
                    <>
                      <div className="absolute inset-x-0 top-0 h-[7%] bg-rose-500/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Progress bar</span>
                      </div>
                      <div className="absolute right-0 top-[7%] bottom-[24%] w-[15%] bg-rose-500/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white [writing-mode:vertical-lr]">Like / comment / share</span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-[24%] bg-rose-500/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Title + channel + audio</span>
                      </div>
                    </>
                  )}
                  {showZones && zoneMode === 'player' && (
                    <>
                      <div className="absolute right-[2%] bottom-[4%] w-[16%] h-[16%] bg-rose-500/40 backdrop-blur-[1px] flex items-center justify-center rounded">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Duration badge</span>
                      </div>
                      <div className="absolute right-[2%] top-[4%] w-[22%] h-[18%] bg-rose-500/40 backdrop-blur-[1px] flex items-center justify-center rounded">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Hover buttons</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowZones((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    {showZones ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showZones ? 'Hide zones' : 'Show zones'}
                  </button>
                  <button
                    onClick={() => setZoneMode(zoneMode === 'shorts' ? 'player' : 'shorts')}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    {zoneMode === 'shorts' ? 'Shorts zones' : 'Player zones'} (tap to switch)
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
                  >
                    Change image
                  </button>
                </div>
                <p className="mt-2 truncate text-xs text-slate-500">{fileName}</p>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Self check</h3>
                <div className="space-y-2">
                  {selfBoxes.map(([label, checked, set]) => (
                    <label key={label} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 transition hover:border-white/15">
                      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="h-4 w-4 accent-sky-500" />
                      {label}
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleCheck}
                  disabled={loading || signedOutLocked}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {loading ? 'Checking' : signedOutLocked ? 'Sign in to continue' : 'Run readability check'}
                </button>
                {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
                {signedOutLocked && (
                  <button
                    onClick={onRequireAuth}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
                  >
                    <Lock className="h-4 w-4" /> Sign in free for unlimited checks
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {checks && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Results</h2>
            <ul className="space-y-3">
              {checks.map((c) => (
                <li key={c.label} className="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    {statusIcon(c.status)}
                    {c.label}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{c.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              This is a safe-zone and readability preview. It does not detect text in your image.
              Keep important text and faces clear of the red zones.
            </p>
          </div>
        )}

        {checks && onOpenTool && (
          <button
            onClick={() => onOpenTool('title-scorer')}
            className="mt-6 w-full rounded-3xl border border-violet-500/25 bg-violet-500/5 p-5 text-left transition hover:bg-violet-500/10"
          >
            <p className="text-sm font-bold text-slate-100">Thumbnail is clean. Now make the title match it.</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              The thumbnail stops the scroll. The title closes the click. Score yours and get three rewrites.
            </p>
            <span className="mt-2 inline-block text-xs font-bold text-violet-300">Open the Viral Title Scorer</span>
          </button>
        )}
      </div>
    </div>
  );
}
