import React from 'react';
import { ArrowLeft, ArrowUpRight, Bot, Check, Gift, GraduationCap, Zap } from 'lucide-react';
import { ACTIVE_PRICING_PLANS, ACTIVE_PLAN_IDS, type ActivePlanId } from '../lib/pricing';
import { BOT_PRODUCT_PLANS, BOT_PLAN_IDS, type BotPlanId } from '../lib/botProducts';
import type { ViewState } from '../lib/appShared';

interface PricingPageProps {
  onBack: () => void;
  onPurchase: (planId: string) => void;
  onPurchaseBot: (planId: string) => void;
  onSignIn: () => void;
  onOpenTool: (view: ViewState) => void;
  isSignedIn: boolean;
}

const SHORTS_PACK_URL = 'https://shorts-pack-david-j-woodburys-projects.vercel.app/';

function dollars(cents: number): string {
  return `$${cents / 100}`;
}

export default function PricingPage({ onBack, onPurchase, onPurchaseBot, onSignIn, onOpenTool, isSignedIn }: PricingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold font-display tracking-wide mb-4">Pricing</h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
            Start free. Pay only when the tools are earning their keep. Everything below is one ladder, in order.
          </p>
        </div>

        {/* 1. FREE */}
        <section className="mb-10">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Step 1. Free forever</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Free</h2>
                <p className="text-slate-400 mb-5">Everything you need to see the tools work, before you spend anything.</p>
                <ul className="space-y-2.5 mb-6">
                  {[
                    'Sign in with Google, no card required',
                    '3 free credits to start',
                    '1 free credit every day you come back',
                    'One free taste of every tool',
                    'The full Muse AI Quick-Start course, free',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  {isSignedIn ? (
                    <button
                      onClick={() => onOpenTool('muse-course')}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Open the free course
                    </button>
                  ) : (
                    <button
                      onClick={onSignIn}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
                    >
                      Sign in with Google
                    </button>
                  )}
                </div>
              </div>
              <div className="text-center md:text-right flex-shrink-0">
                <div className="text-5xl font-black">$0</div>
                <div className="text-slate-500 text-sm mt-1">free forever</div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. $9 TRIPWIRE */}
        <section className="mb-10">
          <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Step 2. The $9 tripwire</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">30-Day Viral Shorts Pack</h2>
                <p className="text-slate-400 mb-5">A full month of short-form video ideas, done for you. One payment, yours to keep.</p>
                <ul className="space-y-2.5 mb-6">
                  {[
                    '30 copy-paste AI video prompts',
                    'A title and hashtag set for every prompt',
                    '30-day posting calendar and quick-start checklist',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={SHORTS_PACK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors items-center gap-2"
                >
                  Get the pack
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
              <div className="text-center md:text-right flex-shrink-0">
                <div className="text-5xl font-black">$9</div>
                <div className="text-slate-500 text-sm mt-1">one-time payment</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CREDIT PACKS */}
        <section className="mb-10">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Step 3. Credit packs</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-2">Fuel for every tool</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Credits power the Title Scorer, Upload Auditor, Thumbnail Checker, Title Test Tracker, Script Builder, and Veo Studio.
              One menu, here and on PromoFinder. Credits never expire.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ACTIVE_PLAN_IDS.map((planId: ActivePlanId) => {
              const plan = ACTIVE_PRICING_PLANS[planId];
              const featured = planId === 'pro';
              return (
                <div
                  key={planId}
                  className={`rounded-3xl border p-6 flex flex-col ${
                    featured
                      ? 'border-indigo-400/60 bg-indigo-500/10 shadow-xl shadow-indigo-500/10'
                      : 'border-white/10 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {plan.badge && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        featured ? 'bg-indigo-400 text-slate-950' : 'bg-white/10 text-slate-300'
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-black">{dollars(plan.priceInCents)}</span>
                    <span className="text-slate-500 pb-1 text-sm">one-time</span>
                  </div>
                  <div className="text-indigo-300 font-semibold mb-1">{plan.credits} credits</div>
                  <div className="text-slate-500 text-xs mb-5">
                    ${(plan.priceInCents / 100 / plan.credits).toFixed(2)} per credit
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onPurchase(planId)}
                    className={`w-full py-3 font-bold rounded-xl transition-colors ${
                      featured
                        ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    Get {plan.credits} credits
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. BOT PACKS */}
        <section className="mb-6">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Step 4. For operators</span>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 mb-2">Bot personality packs</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              One-time downloads for your own trading bots. Bring your own AI key. No subscription.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BOT_PLAN_IDS.map((planId: BotPlanId) => {
              const plan = BOT_PRODUCT_PLANS[planId];
              const featured = planId === 'bot-pro';
              return (
                <div
                  key={planId}
                  className={`rounded-3xl border p-6 flex flex-col ${
                    featured
                      ? 'border-purple-400/60 bg-purple-500/10 shadow-xl shadow-purple-500/10'
                      : 'border-white/10 bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-300" />
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                    </div>
                    {plan.badge && (
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wide">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-black">{dollars(plan.priceInCents)}</span>
                    <span className="text-slate-500 pb-1 text-sm">one-time</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-5">{plan.description}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onPurchaseBot(planId)}
                    className={`w-full py-3 font-bold rounded-xl transition-colors ${
                      featured
                        ? 'bg-purple-500 hover:bg-purple-400 text-white'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    Get the {plan.name.split(' ')[0]} pack
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-center text-slate-500 text-sm mt-10">
          Questions? Every purchase is covered by the refund policy, linked in the footer.
        </p>
      </div>
    </div>
  );
}
