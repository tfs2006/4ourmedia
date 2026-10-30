import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock, Lock,
  GraduationCap, Sparkles,
} from 'lucide-react';
import type { AuthUser } from '../services/supabase';
import { supabase } from '../services/supabase';
import {
  LESSONS, COURSE_TITLE, COURSE_TAGLINE, COURSE_THROUGHLINE,
  MUSE_JOIN_URL, REFERRAL_CODE_1, type CourseBlock, type CourseLesson,
} from '../lib/museCourse';

interface MuseCoursePageProps {
  onBack: () => void;
  user: AuthUser | null;
  onRequireAuth: () => void;
  onNavigate: (view: string) => void;
}

const PROGRESS_KEY = 'muse_course_progress';

function readLocalProgress(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocalProgress(ids: string[]) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

const Block: React.FC<{ block: CourseBlock }> = ({ block }) => {
  if (block.type === 'p') {
    return <p className="text-slate-300 leading-relaxed">{block.text}</p>;
  }
  if (block.type === 'callout') {
    return (
      <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-5 py-4">
        <p className="text-violet-100 font-medium leading-relaxed">{block.text}</p>
      </div>
    );
  }
  if (block.type === 'steps') {
    return (
      <ol className="space-y-3">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
              {i + 1}
            </span>
            <span className="text-slate-300 leading-relaxed pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="space-y-2.5">
      {block.items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <Check className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
          <span className="text-slate-300 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const CrossSell: React.FC<{ sell: NonNullable<CourseLesson['crossSell']>; onNavigate: (v: string) => void }> = ({ sell, onNavigate }) => {
  const go = () => {
    if (sell.internal) {
      const view = sell.href.replace(/^\//, '');
      onNavigate(view);
    } else {
      window.open(sell.href, '_blank', 'noopener');
    }
  };
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <p className="text-sm text-slate-300">{sell.text}</p>
      <button
        onClick={go}
        className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-bold text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
      >
        {sell.cta}
      </button>
    </div>
  );
};

export default function MuseCoursePage({ onBack, user, onRequireAuth, onNavigate }: MuseCoursePageProps) {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(() => readLocalProgress());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('course_progress')
          .select('completed_lessons')
          .eq('user_id', user.id)
          .single();
        if (!error && data?.completed_lessons) {
          const merged = Array.from(new Set([...readLocalProgress(), ...(data.completed_lessons as string[])]));
          setCompleted(merged);
          writeLocalProgress(merged);
        }
      } catch {
        /* table may not exist yet; localStorage fallback stands */
      }
    })();
  }, [user]);

  async function markComplete(lessonId: string) {
    const next = Array.from(new Set([...completed, lessonId]));
    setCompleted(next);
    writeLocalProgress(next);
    if (!user) return;
    try {
      await supabase.from('course_progress').upsert(
        { user_id: user.id, completed_lessons: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    } catch {
      /* localStorage fallback stands */
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(REFERRAL_CODE_1).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function startCourse() {
    if (!user) {
      onRequireAuth();
      return;
    }
    setActiveLesson(LESSONS[0].id);
    window.scrollTo(0, 0);
  }

  const lesson = LESSONS.find((l) => l.id === activeLesson) || null;
  const lessonIndex = lesson ? LESSONS.indexOf(lesson) : -1;
  const nextLesson = lesson && lessonIndex < LESSONS.length - 1 ? LESSONS[lessonIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pg-bg" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => (activeLesson ? setActiveLesson(null) : onBack())}
          className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {activeLesson ? 'All lessons' : 'Back'}
        </button>

        {!lesson && (
          <>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">Free course</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight">
                {COURSE_TITLE} <span className="text-violet-300">(Free)</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-slate-400 leading-relaxed">{COURSE_TAGLINE}</p>
              <div className="mx-auto mt-5 max-w-xl rounded-xl border border-violet-400/25 bg-violet-500/10 px-5 py-4">
                <p className="text-sm text-violet-100 leading-relaxed">{COURSE_THROUGHLINE}</p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-300" /> 5 lessons</span>
                <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-violet-300" /> About 35 min</span>
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300" /> {completed.length}/5 done</span>
              </div>
              <div className="mx-auto mt-4 h-2 max-w-xl overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${(completed.length / LESSONS.length) * 100}%` }}
                />
              </div>
              <button
                onClick={startCourse}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-purple-500/25 hover:from-indigo-400 hover:to-purple-400 transition-all"
              >
                {user ? <GraduationCap className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                {completed.length > 0 ? 'Continue free' : 'Start free'}
              </button>
              {!user && (
                <p className="mt-3 text-xs text-slate-500">One click with Google. We track your progress.</p>
              )}
            </div>

            <div className="mt-10 space-y-3">
              {LESSONS.map((l, i) => {
                const done = completed.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      if (!user) {
                        onRequireAuth();
                        return;
                      }
                      setActiveLesson(l.id);
                      window.scrollTo(0, 0);
                    }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left transition-colors hover:border-violet-400/40"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg font-black text-violet-200">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold">{l.title}</h3>
                          {done && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{l.blurb}</p>
                        <p className="mt-2 text-xs text-slate-500">{l.minutes} min</p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-slate-600 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <p className="text-sm text-slate-400">New to Muse? Your first step takes two minutes.</p>
              <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
                <code className="rounded-lg bg-slate-800 px-4 py-2 text-lg font-mono font-bold tracking-widest text-violet-200">
                  {REFERRAL_CODE_1}
                </code>
                <button
                  onClick={copyCode}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:text-white hover:border-violet-400/50 transition-colors"
                >
                  {copied ? 'Copied' : 'Copy code'}
                </button>
                <a
                  href={MUSE_JOIN_URL}
                  target="_blank"
                  rel="noopener"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-bold text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
                >
                  Join Muse
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-500">Both sides get 1 billion tokens. Redeem in Settings within 48 hours of joining.</p>
            </div>
          </>
        )}

        {lesson && (
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
              Lesson {lessonIndex + 1} of {LESSONS.length}
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">{lesson.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{lesson.minutes} min</p>

            <div className="mt-6 space-y-5">
              {lesson.blocks.map((b, i) => (
                <Block key={i} block={b} />
              ))}
            </div>

            {lesson.openLoop && (
              <div className="mt-8 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-5 py-4">
                <p className="text-sm text-indigo-100 leading-relaxed">
                  <span className="font-bold">Next: </span>{lesson.openLoop}
                </p>
              </div>
            )}

            {lesson.crossSell && (
              <div className="mt-6">
                <CrossSell sell={lesson.crossSell} onNavigate={onNavigate} />
              </div>
            )}

            {lesson.finalCtas && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Your next upload</h2>
                <div className="space-y-3">
                  {lesson.finalCtas.map((cta, i) => (
                    <CrossSell key={i} sell={cta} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-between border-t border-slate-800 pt-6">
              {completed.includes(lesson.id) ? (
                <span className="inline-flex items-center gap-2 text-emerald-300 font-semibold">
                  <CheckCircle2 className="h-5 w-5" /> Completed
                </span>
              ) : (
                <button
                  onClick={() => markComplete(lesson.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-2.5 font-bold text-emerald-200 hover:bg-emerald-500/20 transition-all"
                >
                  <Check className="h-5 w-5" /> Mark lesson complete
                </button>
              )}
              {nextLesson ? (
                <button
                  onClick={() => {
                    setActiveLesson(nextLesson.id);
                    window.scrollTo(0, 0);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 font-bold text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
                >
                  Next: {nextLesson.title} <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveLesson(null);
                    window.scrollTo(0, 0);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 font-bold text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
                >
                  Back to all lessons <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
