import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Clapperboard, Download, Film, KeyRound, Layers,
  Loader2, PlayCircle, Sparkles, Upload, Wand2, X,
} from 'lucide-react';
import type {
  GeneratedVideo,
  VideoAspectRatio,
  VideoGenerationConfig,
  VideoGenerationMode,
  VideoGenerationStatus,
  VideoResolution,
} from '../types';
import type { AuthUser } from '../services/supabase';
import { generatePromoVideo } from '../services/videoService';
import { FEATURE_PRICING } from '../lib/pricing';

interface VeoStudioPageProps {
  onBack: () => void;
  user: AuthUser | null;
  creditsRemaining: number;
  onRequireAuth: () => void;
  onRequirePurchase: () => void;
  onCreditsUpdated: (remaining: number) => void;
}

interface UploadPanelProps {
  label: string;
  description: string;
  files: File[];
  maxFiles: number;
  compact?: boolean;
  onFilesChange: (files: File[]) => void;
}

const generationModes: Array<{ mode: VideoGenerationMode; title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = [
  {
    mode: 'assets',
    title: 'Style Reference',
    description: 'Upload up to three source images to keep characters, products, or visual style consistent.',
    icon: Layers,
  },
  {
    mode: 'frames',
    title: 'Frame Control',
    description: 'Animate from a single image or move between a defined start and end frame.',
    icon: Clapperboard,
  },
];

function UploadPanel({ label, description, files, maxFiles, compact = false, onFilesChange }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (incomingFiles: File[]) => {
    const imageFiles = incomingFiles.filter((file) => file.type.startsWith('image/'));
    onFilesChange([...files, ...imageFiles].slice(0, maxFiles));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <span className="text-xs text-slate-500">{files.length}/{maxFiles}</span>
      </div>

      {files.length < maxFiles && (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(Array.from(event.dataTransfer.files));
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 text-center transition-all ${compact ? 'min-h-[10rem]' : 'min-h-[13rem]'} ${isDragging ? 'border-indigo-400 bg-indigo-500/10' : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 hover:bg-slate-900'}`}
        >
          <input
            type="file"
            accept="image/*"
            multiple={maxFiles > 1}
            className="hidden"
            onChange={(event) => addFiles(Array.from(event.target.files || []))}
          />
          <div className="space-y-3 py-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Drop images here or click to browse</p>
              <p className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP</p>
            </div>
          </div>
        </label>
      )}

      {files.length > 0 && (
        <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-2xl border border-slate-700 bg-black aspect-square">
              <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))}
                className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white transition-colors hover:bg-rose-500/90"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VeoStudioPage({
  onBack,
  user,
  creditsRemaining,
  onRequireAuth,
  onRequirePurchase,
  onCreditsUpdated,
}: VeoStudioPageProps) {
  const videoCreditCost = FEATURE_PRICING['veo-video'].creditsRequired;
  const [mode, setMode] = useState<VideoGenerationMode>('assets');
  const [prompt, setPrompt] = useState('');
  const [assetImages, setAssetImages] = useState<File[]>([]);
  const [startFrame, setStartFrame] = useState<File[]>([]);
  const [endFrame, setEndFrame] = useState<File[]>([]);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [status, setStatus] = useState<VideoGenerationStatus>({ isGenerating: false, progressMessage: '' });

  useEffect(() => {
    return () => {
      if (generatedVideo?.url) {
        URL.revokeObjectURL(generatedVideo.url);
      }
    };
  }, [generatedVideo]);

  const handleGenerate = async () => {
    if (status.isGenerating) {
      return;
    }

    if (!user) {
      onRequireAuth();
      return;
    }

    if (creditsRemaining < videoCreditCost) {
      onRequirePurchase();
      return;
    }

    if (!prompt.trim()) {
      setStatus({ isGenerating: false, progressMessage: '', error: 'Describe the shot, motion, lighting, and camera movement first.' });
      return;
    }

    if (mode === 'assets' && assetImages.length === 0) {
      setStatus({ isGenerating: false, progressMessage: '', error: 'Upload at least one reference image for style consistency.' });
      return;
    }

    if (mode === 'frames' && startFrame.length === 0) {
      setStatus({ isGenerating: false, progressMessage: '', error: 'Upload a start frame to animate from.' });
      return;
    }

    setStatus({ isGenerating: true, progressMessage: 'Sending your scene to Veo...', error: undefined });

    try {
      if (generatedVideo?.url) {
        URL.revokeObjectURL(generatedVideo.url);
      }

      const config: VideoGenerationConfig = {
        prompt: prompt.trim(),
        mode,
        assetImages,
        startFrame: startFrame[0] || null,
        endFrame: endFrame[0] || null,
        aspectRatio,
        resolution,
      };

      setGeneratedVideo(null);
      setStatus({ isGenerating: true, progressMessage: 'Veo is rendering motion, lighting, and camera moves. This can take a minute.', error: undefined });

      const video = await generatePromoVideo(config);
      if (typeof video.remainingCredits === 'number') {
        onCreditsUpdated(video.remainingCredits);
      }

      setGeneratedVideo(video);
      setStatus({ isGenerating: false, progressMessage: '' });
    } catch (error: any) {
      if (error?.message?.includes('Not enough credits')) {
        onRequirePurchase();
      }
      setStatus({
        isGenerating: false,
        progressMessage: '',
        error: error?.message || 'Video generation failed. Try a simpler prompt or different source images.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to PromoGen
            </button>
            <div className="hidden h-6 w-px bg-slate-700 md:block" />
            <div className="hidden items-center gap-3 md:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-lg shadow-indigo-900/40">
                <Film className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">Veo Studio</p>
                <p className="text-xs text-slate-400">Native video generation inside 4ourMedia</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-300">
              {creditsRemaining} credits
            </div>
            {!user ? (
              <button onClick={onRequireAuth} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-200">
                Sign In
              </button>
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                {user.email}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-5">
          <div className="overflow-hidden rounded-[2rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 p-6 shadow-2xl shadow-indigo-950/30">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
              <Sparkles className="h-4 w-4" />
              New Feature
            </div>
            <h1 className="mt-5 text-4xl font-bold font-display leading-tight">
              Turn product stills into motion-ready campaign clips.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Veo Studio gives PromoGen a video workflow: upload reference images or guide the opening and closing frame, write the shot direction, and export a finished motion asset without leaving the app.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[`${videoCreditCost} credits per Veo render`, 'Reference-image consistency', 'Frame-to-frame animation control', 'Runs on your Gemini backend'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-1">
              {generationModes.map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setMode(item.mode)}
                  className={`rounded-[1.1rem] px-4 py-3 text-left transition-all ${mode === item.mode ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                  <p className={`mt-2 text-xs leading-5 ${mode === item.mode ? 'text-indigo-50/85' : 'text-slate-500'}`}>
                    {item.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Shot Direction</label>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: Slow dolly-in on the product, shallow depth of field, glossy reflections, subtle golden rim light, ending on a tight hero close-up."
                  className="min-h-[10rem] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-400"
                />
              </div>

              {mode === 'assets' ? (
                <UploadPanel
                  label="Reference Assets"
                  description="Use up to three images to lock style, characters, or product identity."
                  files={assetImages}
                  maxFiles={3}
                  onFilesChange={setAssetImages}
                />
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  <UploadPanel
                    label="Start Frame"
                    description="The first frame Veo should animate from."
                    files={startFrame}
                    maxFiles={1}
                    compact
                    onFilesChange={setStartFrame}
                  />
                  <UploadPanel
                    label="End Frame"
                    description="Optional. Add a target final frame for a morph or transition."
                    files={endFrame}
                    maxFiles={1}
                    compact
                    onFilesChange={setEndFrame}
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Resolution</label>
                  <select
                    value={mode === 'assets' ? '720p' : resolution}
                    onChange={(event) => setResolution(event.target.value as VideoResolution)}
                    disabled={mode === 'assets'}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Aspect Ratio</label>
                  <select
                    value={mode === 'assets' ? '16:9' : aspectRatio}
                    onChange={(event) => setAspectRatio(event.target.value as VideoAspectRatio)}
                    disabled={mode === 'assets'}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition-colors disabled:cursor-not-allowed disabled:text-slate-500"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Vertical</option>
                  </select>
                </div>
              </div>

              {status.error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
                  {status.error}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={status.isGenerating}
                  className={`inline-flex min-w-[12rem] items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition-all ${status.isGenerating ? 'cursor-wait bg-slate-700 text-slate-200' : 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-900/40 hover:from-indigo-400 hover:to-cyan-400'}`}
                >
                  {status.isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  {status.isGenerating ? 'Generating Video...' : 'Generate Video'}
                </button>
                <div className="text-sm text-slate-400">
                  Veo renders consume {videoCreditCost} credits after a successful result.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-sm text-slate-400">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-4 w-4 text-indigo-300" />
                  <p>
                    This page uses the same Gemini API setup as PromoGen. If your current key does not have Veo access enabled, the backend will return the upstream Gemini error directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 lg:col-span-7">
          <div className="flex min-h-[34rem] flex-1 flex-col overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/85 shadow-2xl shadow-black/25">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Preview Monitor</h2>
                <p className="text-xs text-slate-500">Render output and download</p>
              </div>
              {status.isGenerating && <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Processing</span>}
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-6">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

              {status.isGenerating ? (
                <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
                  <div className="relative mb-6 h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-cyan-300" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white">Rendering motion</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{status.progressMessage}</p>
                </div>
              ) : generatedVideo ? (
                <div className="relative z-10 flex w-full flex-col gap-5">
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-700 bg-black shadow-2xl shadow-black/30">
                    <video src={generatedVideo.url} controls autoPlay loop className="mx-auto max-h-[72vh] w-full object-contain" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <a
                      href={generatedVideo.url}
                      download={generatedVideo.fileName}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-200"
                    >
                      <Download className="h-4 w-4" />
                      Download Video
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex max-w-md flex-col items-center text-center text-slate-500">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70">
                    <PlayCircle className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-200">Your next promo video lands here</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Use style references for visual consistency or frame mode for tighter shot control. Prompts that mention subject movement, camera motion, and lighting usually produce stronger results.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Best Prompt Inputs</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Camera move, subject motion, lighting, pacing, and final hero frame.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asset Mode Limits</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Reference-image mode is locked by Veo to 720p and 16:9. The UI enforces that.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Production Use</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Generate short hooks, ad openers, product glam shots, and motion tests before full edits.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}