import React from 'react';
import {
  ArrowRight, Check, GraduationCap, Zap, MessageSquareQuote, Type,
  Image as ImageIcon, ClipboardCheck, BarChart3, Palette, Clapperboard, Search,
} from 'lucide-react';
import { SparklesIcon } from './Icons';
import { ACTIVE_PLAN_IDS, ACTIVE_PRICING_PLANS, formatPricePerCredit } from '../lib/pricing';

interface LandingPageProps {
  onGetStarted: () => void;
  onLaunchPromofinder?: (url: string, newTab?: boolean) => void | Promise<void>;
  onPurchase: (planId: string) => void;
  onPurchaseBot?: (planId: string) => void;
  onNavigate?: (page: string) => void;
}

interface ToolCard {
  icon: React.ReactNode;
  title: string;
  benefit: string;
  nextDoor: string;
  cta: string;
  go: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase, onNavigate }) => {
  const go = (view: string) => () => onNavigate?.(view);

  const TOOLS: ToolCard[] = [
    {
      icon: <MessageSquareQuote className="h-6 w-6 text-amber-300" />,
      title: 'Hook Swipe File',
      benefit: '560+ proven video openers, sorted by niche. Never stare at a blank page again.',
      nextDoor: 'Hook chosen? Give it a title that pulls.',
      cta: 'Browse hooks',
      go: go('hook-library'),
    },
    {
      icon: <Type className="h-6 w-6 text-violet-300" />,
      title: 'Viral Title Scorer',
      benefit: 'Score any title 0-100 against real copywriting rules, with rewrites that score higher.',
      nextDoor: 'Title locked? Make sure the thumbnail survives the feed.',
      cta: 'Score a title',
      go: go('title-scorer'),
    },
    {
      icon: <ImageIcon className="h-6 w-6 text-sky-300" />,
      title: 'Thumbnail Safe-Zone Preview',
      benefit: 'See exactly what the Shorts UI covers before you publish. No more hidden text.',
      nextDoor: 'Creative ready? Run the full pre-publish audit.',
      cta: 'Check a thumbnail',
      go: go('thumbnail-checker'),
    },
    {
      icon: <ClipboardCheck className="h-6 w-6 text-emerald-300" />,
      title: 'Pre-Publish Upload Auditor',
      benefit: 'Title, description, tags, and checklist in one pass. Catch the mistake before your viewers do.',
      nextDoor: 'Published? Find out which titles actually win.',
      cta: 'Audit an upload',
      go: go('upload-auditor'),
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-rose-300" />,
      title: 'Title Test Tracker',
      benefit: 'Log CTR, declare a real winner, and build a swipe file of what works for your audience.',
      nextDoor: 'Know what wins? Make matching promo creative.',
      cta: 'Track a test',
      go: go('title-tracker'),
    },
    {
      icon: <Palette className="h-6 w-6 text-fuchsia-300" />,
      title: 'PromoGen',
      benefit: 'Branded 9:16 promo images from any product URL, in five proven copy styles.',
      nextDoor: 'Need motion instead of stills? Render it in Veo Studio.',
      cta: 'Generate promos',
      go: onGetStarted,
    },
    {
      icon: <Clapperboard className="h-6 w-6 text-indigo-300" />,
      title: 'Veo Studio',
      benefit: 'AI video renders with style reference and frame control, right in your browser.',
      nextDoor: 'Running low on credits? The packs are below.',
      cta: 'Render video',
      go: go('veo-studio'),
    },
  ];

  const PLANS = ACTIVE_PLAN_IDS.map((id) => ACTIVE_PRICING_PLANS[id]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="pg-bg" />

      {/* Feature Announcement Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-700 text-white py-2.5 px-4 text-center text-sm font-semibold">
        <div className="absolute inset-0 shimmer opacity-20" />
        <div className="relative flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-2">
            <SparklesIcon size={14} className="text-yellow-300" />
            Promofinder research suite is now front and center. Find sponsors, hidden videos, and creator fit before you build the campaign
          </span>
          <button
            onClick={go('free-tools')}
            className="hidden sm:flex items-center gap-1.5 bg-white/15 px-3 py-0.5 rounded-full border border-white/20 text-xs text-yellow-200 font-bold hover:bg-white/25 transition-colors"
          >
            Open the suite
          </button>
        </div>
      </div>

      {/* 30-Day Viral Shorts Pack Promo Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-700 via-rose-600 to-amber-600 text-white py-2.5 px-4 text-center text-sm font-semibold">
        <div className="absolute inset-0 shimmer opacity-20" />
        <div className="relative flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-2">
            <SparklesIcon size={14} className="text-yellow-200" />
            30 Days of Viral Shorts, Done For You: 30 copy-paste AI video prompts with titles and hashtags. Just $9.
          </span>
          <a
            href="https://shorts-pack-david-j-woodburys-projects.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white text-rose-700 px-4 py-1 rounded-full text-xs font-bold hover:bg-yellow-200 transition-colors"
          >
            Get the Pack
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-14 sm:py-20 lg:py-24 px-4 overflow-hidden">
        <div className="glow-orb-violet" style={{ width: '600px', height: '600px', top: '-10%', left: '-10%', opacity: 0.6 }} />
        <div className="glow-orb-blue" style={{ width: '500px', height: '500px', bottom: '0%', right: '-5%', opacity: 0.5 }} />
        <div className="relative container mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
            For YouTube and Shorts creators
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white">
            Publish videos that pull.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Seven tools that take the guesswork out of every upload. Score your titles,
            audit your metadata, stock 560+ proven hooks, check your thumbnails, track
            what wins, and generate the promo creative. One account, one credit system.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-purple-500/25 hover:from-indigo-400 hover:to-purple-400 transition-all"
            >
              Start free <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={go('muse-course')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-8 py-3.5 text-lg font-bold text-slate-200 hover:border-violet-400/50 hover:text-white transition-all"
            >
              <GraduationCap className="h-5 w-5 text-violet-300" /> Take the free course
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Free to start. 3 credits on signup, plus a free credit every day.
          </p>
        </div>
      </section>

      {/* Tools grid */}
      <section className="relative px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-black text-white text-center">The full upload workflow, covered.</h2>
          <p className="mt-3 text-center text-slate-400 max-w-2xl mx-auto">
            Every step from blank page to published video has a tool. They link together,
            so finishing one always shows you the next.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <div
                key={tool.title}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-colors hover:border-violet-400/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80">
                  {tool.icon}
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{tool.benefit}</p>
                <p className="mt-4 text-sm font-medium text-violet-200/90">{tool.nextDoor}</p>
                <button
                  onClick={tool.go}
                  className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-bold text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  {tool.cta} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex flex-col rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">Promofinder Suite</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                Nine research tools: unlisted video finder, sponsor search, rate estimator, channel fit, and more.
              </p>
              <p className="mt-4 text-sm font-medium text-violet-200/90">
                Research done? Come back and build the creative here.
              </p>
              <button
                onClick={go('free-tools')}
                className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-bold text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                Open the suite <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Free course */}
      <section className="relative px-4 py-14">
        <div className="container mx-auto max-w-4xl">
          <div className="rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-950/60 via-slate-900 to-slate-900 p-8 sm:p-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">Free course</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
              Learn the AI chief of staff in 35 minutes.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400 leading-relaxed">
              Muse AI Quick-Start: five short lessons that take you from curious to running
              a one-person business with an AI assistant. Free forever.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-violet-200/90">
              One idea runs through all five lessons: you plus AI leverage lets you think bigger.
            </p>
            <button
              onClick={go('muse-course')}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-purple-500/25 hover:from-indigo-400 hover:to-purple-400 transition-all"
            >
              <GraduationCap className="h-5 w-5" /> Start the free course
            </button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative px-4 py-14">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-black text-white text-center">Credits that never expire.</h2>
          <p className="mt-3 text-center text-slate-400 max-w-xl mx-auto">
            Every tool runs on credits. Buy once, use them any time, on anything.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  plan.popular
                    ? 'border-violet-400/60 bg-violet-950/40 shadow-xl shadow-purple-900/20'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-0.5 text-xs font-bold text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-black text-white">${plan.priceInCents / 100}</span>
                  <span className="ml-2 text-sm text-slate-400">{plan.credits} credits</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatPricePerCredit(plan.id)} per credit. Credits never expire.
                </p>
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-300 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onPurchase(plan.id)}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-purple-500/25'
                      : 'border border-slate-700 bg-slate-800/70 hover:border-violet-400/50'
                  }`}
                >
                  <Zap className="h-4 w-4" /> Get {plan.credits} credits
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-8">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">4ourMedia. Tools for creators who publish.</p>
          <div className="flex gap-5 text-sm">
            <button onClick={() => onNavigate?.('privacy')} className="text-slate-500 hover:text-slate-300 transition-colors">Privacy</button>
            <button onClick={() => onNavigate?.('terms')} className="text-slate-500 hover:text-slate-300 transition-colors">Terms</button>
            <button onClick={() => onNavigate?.('refund')} className="text-slate-500 hover:text-slate-300 transition-colors">Refunds</button>
            <button onClick={() => onNavigate?.('contact')} className="text-slate-500 hover:text-slate-300 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
