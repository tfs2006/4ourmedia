import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Zap, Clock, Target, Shield, TrendingUp, 
  CheckCircle, Star, ArrowRight, Play, Users, Award,
  Palette, Brain, Download, Globe, Mail, Crown,
  Layers, Image, Package, Infinity, Timer, Gift,
  AlertTriangle, ChevronDown, X, CreditCard, Lock
} from 'lucide-react';
import {
  MagicWandIcon, RocketIcon, SpeedIcon, AIBrainIcon, SparklesIcon,
  TrophyIcon, TemplateIcon, ImageIcon as PGImageIcon, ShieldIcon,
  CheckCircleIcon, TimerIcon, PaletteIcon, TrendingUpIcon, CrownIcon,
  GiftIcon, LockIcon, SadFaceIcon, CelebrationIcon, LightbulbIcon,
  ROIIcon, MobileIcon, GlobeIcon, AvatarArtistIcon, AvatarMarketerIcon,
  AvatarFounderIcon, PackageIcon, CloseIcon, ArrowRightIcon, StarIcon,
  CommunityIcon, DownloadIcon, CardIcon
} from './Icons';
import { ACTIVE_PLAN_IDS, ACTIVE_PRICING_PLANS, FEATURE_PRICING, formatPricePerCredit } from '../lib/pricing';

interface LandingPageProps {
  onGetStarted: () => void;
  onPurchase: (planId: string) => void;
  onNavigate?: (page: string) => void;
}

// Pricing Plans Type
interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  pricePerCredit?: string;
  description: string;
  popular: boolean;
  badge: string | null;
  savings?: string;
  interval?: string;
  features: string[];
}

const PRICING_PLANS: Record<string, PricingPlan> = Object.fromEntries(
  ACTIVE_PLAN_IDS.map((planId) => {
    const plan = ACTIVE_PRICING_PLANS[planId];
    return [
      planId,
      {
        id: plan.id,
        name: plan.name,
        credits: plan.credits,
        price: plan.priceInCents / 100,
        originalPrice: plan.originalPriceInCents ? plan.originalPriceInCents / 100 : undefined,
        pricePerCredit: formatPricePerCredit(plan.id),
        description: plan.description,
        popular: !!plan.popular,
        badge: plan.badge || null,
        savings: plan.savings,
        features: plan.features,
      },
    ];
  })
) as Record<string, PricingPlan>;

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase, onNavigate }) => {
  const [showExitIntent, setShowExitIntent] = useState(false);

  useEffect(() => {
    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !localStorage.getItem('exitIntentShown')) {
        setShowExitIntent(true);
        localStorage.setItem('exitIntentShown', 'true');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-deep)' }}>
      <div className="pg-bg" />
      
      {/* Feature Announcement Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-indigo-700 text-white py-2.5 px-4 text-center text-sm font-semibold">
        <div className="absolute inset-0 shimmer opacity-20" />
        <div className="relative flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-2">
            <SparklesIcon size={14} className="text-yellow-300" />
            Social Content Kit included — promo image + caption + hashtags + video hook in one generation
          </span>
          <span className="hidden sm:flex items-center gap-1.5 bg-white/15 px-3 py-0.5 rounded-full border border-white/20 text-xs text-yellow-200 font-bold">
            Instagram · TikTok · Facebook · LinkedIn · YouTube
          </span>
        </div>
      </div>

            {/* Hero Section */}
      <section className="relative py-12 sm:py-16 lg:py-28 px-4 overflow-hidden">
        {/* Background orbs */}
        <div className="glow-orb-violet" style={{ width: '600px', height: '600px', top: '-10%', left: '-10%', opacity: 0.6 }} />
        <div className="glow-orb-blue"   style={{ width: '500px', height: '500px', bottom: '0%', right: '-5%', opacity: 0.5 }} />
        <div className="glow-orb-gold"   style={{ width: '300px', height: '300px', top: '30%', left: '50%', opacity: 0.4 }} />
        
        <div className="relative container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12">
            
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500/15 rounded-full border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium">
                <SparklesIcon size={14} className="text-emerald-400" />
                The Complete Social Media Kit for Online Sellers
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200">
                  Paste a URL. Get a
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Ready-to-Post Kit.
                </span>
              </h1>
              
              <p className="text-base sm:text-xl md:text-2xl text-slate-300 max-w-xl leading-relaxed">
                PromoGen analyzes any Amazon, Shopify, or Etsy product and instantly creates a{' '}
                <strong className="text-white">promo image</strong>,{' '}
                <strong className="text-white">caption</strong>,{' '}
                <strong className="text-white">hashtags</strong>, and{' '}
                <strong className="text-white">video hook</strong> — tailored to your chosen platform.
              </p>

              <p className="text-base text-slate-400 max-w-lg">
                No designer. No copywriter. No agency. Just paste the URL, pick your platform, and walk away with a complete content kit in under 30 seconds.
              </p>

              {/* Value Props */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { Icon: SpeedIcon,    text: 'Promo image in 10 sec' },
                  { Icon: AIBrainIcon,  text: 'Platform-native caption' },
                  { Icon: TemplateIcon, text: 'Hashtag bundle included' },
                  { Icon: PGImageIcon,  text: 'Instagram · TikTok · LinkedIn · YouTube' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300 glass-card px-3 py-2 text-left">
                    <item.Icon size={16} className="text-violet-400 flex-shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
              
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={onGetStarted}
                  className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 group w-full sm:w-auto"
                >
                  Create My First Promo Free
                  <ArrowRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-ghost text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 w-full sm:w-auto"
                >
                  View Pricing
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 pt-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-400" />
                  No credit card needed
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon size={16} className="text-emerald-400" />
                  3 free generations
                </div>
              </div>
            </div>
            
            {/* Right: Hero Image Preview */}
            <div className="flex-1 relative w-full">
              <div className="relative w-full max-w-[19rem] sm:max-w-sm mx-auto">
                {/* Floating glow rings */}
                <div className="absolute -inset-8 bg-gradient-to-br from-violet-500/10 to-blue-500/10 rounded-3xl blur-2xl" />
                {/* Before/After comparison */}
                <div className="relative grid grid-cols-2 gap-4">
                  {/* Before card */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 text-center font-semibold tracking-widest">BEFORE</p>
                    <div className="aspect-[9/16] bg-slate-800/80 rounded-2xl p-4 border border-slate-700 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center text-slate-500">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 opacity-40">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                          <path d="M3 15l5-4 4 3 4-4 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <p className="text-xs">Boring product photo</p>
                        <p className="text-[10px] mt-1 text-slate-600">Gets scrolled past</p>
                      </div>
                    </div>
                    <p className="text-xs text-rose-400 text-center flex items-center justify-center gap-1">
                      <SadFaceIcon size={14} className="text-rose-400" /> 0 engagement
                    </p>
                  </div>
                  
                  {/* After card */}
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-400 text-center font-bold flex items-center justify-center gap-1">
                      <SparklesIcon size={12} className="text-emerald-400" /> AFTER
                    </p>
                    <div className="aspect-[9/16] bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-2xl p-3 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/25 overflow-hidden flex flex-col justify-end relative">
                      {/* Simulated AI canvas */}
                      <div className="absolute inset-0 bg-gradient-to-b from-violet-700/30 via-transparent to-slate-900/90" />
                      <div className="relative space-y-2">
                        <div className="w-16 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mx-auto"></div>
                        <div className="w-full h-5 bg-white/90 rounded-lg"></div>
                        <div className="w-3/4 h-3 bg-indigo-300/50 rounded-lg mx-auto"></div>
                        <div className="flex justify-center gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <StarIcon key={j} size={8} color="#FBBF24" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-400 text-center font-bold flex items-center justify-center gap-1">
                      <RocketIcon size={12} className="text-emerald-400" /> Engineered to convert
                    </p>
                  </div>
                </div>
                
                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 pg-badge pg-badge-gold animate-float">
                  <SparklesIcon size={10} />
                  AI-Powered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 px-4" style={{ background: 'rgba(14,19,34,0.7)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <CommunityIcon size={20} className="text-violet-400" />
              <span><strong className="text-white">2,847</strong> marketers using PromoGen</span>
            </div>
            <div className="flex items-center gap-2">
              <PGImageIcon size={20} className="text-violet-400" />
              <span><strong className="text-white">48,293</strong> promos generated</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, j) => (
                <StarIcon key={j} size={16} color="#FBBF24" />
              ))}
              <span className="ml-2"><strong className="text-white">4.9</strong> average rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Emotional Hook Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold font-display leading-tight">
            You Know That Feeling When You Post a Product<br />
            <span className="text-slate-400">and Nobody Even Notices?</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            You spent hours finding the perfect product. You know it could change lives. 
            But when you post that plain product photo with a basic caption… <strong className="text-slate-200">crickets</strong>. 
            Meanwhile, another seller promoting the <em>same product</em> is 
            getting clicks, saves, and shares — because their visuals <em>demand</em> attention.
          </p>
          <p className="text-lg text-indigo-300 font-medium">
            The difference isn't the product. It's the presentation.
          </p>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 bg-slate-800/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              The Brutal Truth About Product Marketing in 2026
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              The average person scrolls past <strong className="text-white">300+ ads per day</strong>. 
              You have 0.8 seconds to earn their attention. A plain product photo doesn't stand a chance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Problem */}
            <div className="bg-red-950/30 rounded-2xl p-8 border border-red-900/50">
              <h3 className="text-red-400 font-bold text-lg mb-4 flex items-center gap-2">
                <CloseIcon size={20} className="text-red-500" /> What Most Sellers Do (And Why They Struggle)
              </h3>
              <ul className="space-y-4 text-slate-300">
                {[
                  'Spend 2+ hours wrestling with Canva or Photoshop',
                  'Write headlines that sound generic and forgettable',
                  'Pay designers $50-200 per image (and wait days)',
                  'Post the same boring product-on-white-background photo',
                  'Wonder why engagement is dead and sales feel impossible'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CloseIcon size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-red-300/70 text-sm italic">
                Sound familiar? For most online sellers, creating compelling promotional content is the single biggest bottleneck between a great product and actual sales.
              </p>
            </div>
            
            {/* Solution */}
            <div className="bg-emerald-950/30 rounded-2xl p-8 border border-emerald-900/50">
              <h3 className="text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircleIcon size={20} className="text-emerald-500" /> What Smart Marketers Do Instead
              </h3>
              <ul className="space-y-4 text-slate-300">
                {[
                  'Paste a URL → get a scroll-stopping promo in seconds',
                  'AI writes headlines using proven conversion psychology',
                  'Pay as little as $0.20 per promo — a fraction of design costs',
                  'Export in 4 formats: Story (9:16), Square, Landscape, Instagram Post',
                  'Caption, hashtags & video hook included with every generation'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircleIcon size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-emerald-300/70 text-sm italic">
                "I made back my entire Pro Pack investment on my first sale from a PromoGen ad." — Sarah M.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Built for Anyone Who Sells Online
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Whether you're a solopreneur or a full marketing team, 
              PromoGen fits into your workflow and multiplies your output.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                Icon: PackageIcon,
                iconColor: 'text-blue-400',
                bg: 'from-blue-900/40 to-blue-900/20',
                border: 'border-blue-700/40 hover:border-blue-500/60',
                title: 'E-Commerce Sellers',
                description: 'Amazon, Shopify, Etsy, eBay — turn any product listing URL into a ready-to-post promo in seconds.',
              },
              {
                Icon: MobileIcon,
                iconColor: 'text-violet-400',
                bg: 'from-violet-900/40 to-violet-900/20',
                border: 'border-violet-700/40 hover:border-violet-500/60',
                title: 'Social Media Marketers',
                description: 'Create scroll-stopping ads for Instagram, TikTok, Facebook, and LinkedIn — zero design skills needed.',
              },
              {
                Icon: TrophyIcon,
                iconColor: 'text-amber-400',
                bg: 'from-amber-900/30 to-amber-900/10',
                border: 'border-amber-700/40 hover:border-amber-500/60',
                title: 'Agencies & Freelancers',
                description: 'Deliver polished client creatives in minutes, not days. Bulk-generate across multiple products, brand with client logos, and scale output.',
              },
              {
                Icon: RocketIcon,
                iconColor: 'text-emerald-400',
                bg: 'from-emerald-900/30 to-emerald-900/10',
                border: 'border-emerald-700/40 hover:border-emerald-500/60',
                title: 'Founders & Solopreneurs',
                description: 'You already wear too many hats. Let AI handle design, copywriting, and hashtags — so you can stay focused on your product and growth.',
              },
            ].map((item, i) => (
              <div key={i} className={`bg-gradient-to-br ${item.bg} rounded-2xl p-6 border ${item.border} transition-all group text-center pg-card card-beam`}>
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.Icon size={28} className={item.iconColor} />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              From Zero to Viral-Ready in 3 Clicks
            </h2>
            <p className="text-xl text-slate-400">
              It's almost unfair how easy this is. Your competitors are still opening Canva.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                Icon: GlobeIcon,
                title: 'Paste Your Link',
                description: 'Drop any product URL — Amazon, Shopify, Etsy, your own site. The AI extracts the product name, benefits, pricing, and key details automatically.',
                color: 'from-blue-600 to-cyan-500',
                glow: 'rgba(59,130,246,0.3)'
              },
              {
                step: '02',
                Icon: AIBrainIcon,
                title: 'AI Does the Work',
                description: 'Conversion-optimized headlines, emotion-matched color palettes, and a unique AI-generated background — all tailored to your specific product and target audience.',
                color: 'from-violet-600 to-pink-500',
                glow: 'rgba(124,58,237,0.3)'
              },
              {
                step: '03',
                Icon: DownloadIcon,
                title: 'Download & Post',
                description: 'Ready-to-post images in 4 formats (Story, Square, Landscape, Instagram Post). Add your brand logo, download as high-res PNG, and publish.',
                color: 'from-emerald-500 to-teal-400',
                glow: 'rgba(16,185,129,0.3)'
              }
            ].map((item, i) => (
              <div key={i} className="pg-card card-beam relative p-8 group">
                <div className="step-number mb-6">{item.step}</div>
                <div
                  className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  style={{ boxShadow: `0 8px 32px ${item.glow}` }}
                >
                  <item.Icon size={32} color="#fff" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              11 Conversion-Optimized Templates
            </h2>
            <p className="text-xl text-slate-400">
              Every template built around proven ad structures — from flash sales to luxury launches
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Classic',      bg: 'from-blue-900/60 to-indigo-900/60',    border: 'border-blue-500/50',   tier: 'Free', TierIcon: null, locked: false },
              { name: 'Minimal',      bg: 'from-violet-900/60 to-slate-900/60',   border: 'border-violet-500/50', tier: 'Free', TierIcon: null, locked: false },
              { name: 'Flash Sale',   bg: 'from-rose-900/40 to-slate-900/60',     border: 'border-slate-700',     tier: 'Pro',  TierIcon: SpeedIcon, locked: true },
              { name: 'Luxury',       bg: 'from-amber-900/40 to-slate-900/60',    border: 'border-slate-700',     tier: 'Pro',  TierIcon: CrownIcon, locked: true },
              { name: 'Launch',       bg: 'from-green-900/40 to-slate-900/60',    border: 'border-slate-700',     tier: 'Pro',  TierIcon: RocketIcon, locked: true },
              { name: 'Social Proof', bg: 'from-yellow-900/40 to-slate-900/60',   border: 'border-slate-700',     tier: 'Pro',  TierIcon: StarIcon, locked: true },
              { name: 'Black Friday', bg: 'from-slate-900 to-slate-800/60',       border: 'border-slate-700',     tier: 'Pro',  TierIcon: SpeedIcon, locked: true },
              { name: 'Tech Modern',  bg: 'from-cyan-900/40 to-slate-900/60',     border: 'border-slate-700',     tier: 'Agency', TierIcon: AIBrainIcon, locked: true },
              { name: 'Beauty Glow',  bg: 'from-pink-900/40 to-slate-900/60',     border: 'border-slate-700',     tier: 'Agency', TierIcon: SparklesIcon, locked: true },
              { name: 'Fitness',      bg: 'from-orange-900/40 to-slate-900/60',   border: 'border-slate-700',     tier: 'Agency', TierIcon: SpeedIcon, locked: true },
              { name: 'White Label',  bg: 'from-neutral-900 to-slate-800/60',     border: 'border-slate-700',     tier: 'Agency', TierIcon: ShieldIcon, locked: true },
              { name: '+More',        bg: 'from-indigo-900/40 to-slate-900/60',   border: 'border-slate-700',     tier: 'Coming', TierIcon: GiftIcon, locked: true }
            ].map((template, i) => (
              <div key={i} className={`relative aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-3 border transition-all bg-gradient-to-br ${template.bg} ${template.border} ${
                template.locked ? 'opacity-70' : 'hover:scale-105 hover:opacity-100 shadow-lg'
              }`}>
                {template.locked && (
                  <LockIcon size={14} className="absolute top-2 right-2 text-slate-500" />
                )}
                {template.TierIcon && (
                  <template.TierIcon size={28} className={`mb-2 ${
                    template.tier === 'Pro' ? 'text-indigo-400' :
                    template.tier === 'Agency' ? 'text-amber-400' :
                    template.tier === 'Coming' ? 'text-purple-400' : 'text-emerald-400'
                  }`} />
                )}
                {!template.TierIcon && (
                  <SparklesIcon size={28} className="mb-2 text-emerald-400" />
                )}
                <span className="text-xs font-medium text-center">{template.name}</span>
                <span className={`text-[10px] mt-1 font-bold ${
                  template.tier === 'Free' ? 'text-green-400' : 
                  template.tier === 'Pro' ? 'text-indigo-400' : 
                  template.tier === 'Agency' ? 'text-amber-400' : 'text-slate-500'
                }`}>{template.tier}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Why Marketers Are Switching to PromoGen
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Every feature was designed with one question: <em>"Will this help them sell more?"</em>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: AIBrainIcon,
                color: 'text-violet-400',
                bg: 'bg-violet-500/10',
                title: 'Headlines That Stop the Scroll',
                description: 'The AI applies urgency, social proof, desire, and curiosity to every headline — writing copy engineered to make people pause and click rather than keep scrolling.'
              },
              {
                Icon: PaletteIcon,
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
                title: 'Colors Matched to Your Product',
                description: 'Red for urgency. Gold for premium. Blue for trust. The AI automatically matches your background palette to the emotional tone of your product and target audience.'
              },
              {
                Icon: TemplateIcon,
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10',
                title: 'Templates Built Around Real Ads',
                description: '11 templates modeled on high-performing ad structures — Flash Sale, Luxury, Social Proof, Product Launch, and more. Pick one, paste your URL, done.'
              },
              {
                Icon: PGImageIcon,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                title: '4 Formats, One Click',
                description: 'Story/Reel (9:16), Square Post (1:1), YouTube Banner (16:9), Instagram Post (4:5) — generate the perfect format for any platform with zero manual resizing.'
              },
              {
                Icon: SpeedIcon,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                title: 'Faster Than Any Manual Workflow',
                description: 'While a competitor is still in Canva or waiting on a freelancer, you go from URL to published promo in under a minute. Speed is a real competitive edge.'
              },
              {
                Icon: CommunityIcon,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                title: 'AI Audience & Copy Intelligence',
                description: 'Every generation includes an AI breakdown of your ideal buyer — demographics, emotional pain points, and the copy angles most likely to drive action for your specific product.'
              }
            ].map((feature, i) => (
              <div key={i} className="pg-card card-beam p-6 group">
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.Icon size={24} className={feature.color} />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Promo (SEO) */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-violet-950/60 p-8 md:p-10">
            <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-200">
                  Growth Services
                </span>
                <h2 className="mt-4 text-3xl font-bold font-display leading-tight text-white md:text-4xl">
                  Need Done-For-You AI Marketing Services?
                </h2>
                <p className="mt-4 max-w-3xl text-slate-300 leading-relaxed">
                  If you are searching for <strong className="text-white">AI marketing services</strong>, <strong className="text-white">social media content services</strong>, <strong className="text-white">YouTube sponsorship research</strong>, or <strong className="text-white">ecommerce promo design services</strong>, our team built a dedicated services hub for strategy + execution.
                </p>
                <p className="mt-3 max-w-3xl text-slate-400">
                  Use PromoGen for instant creative output, then scale faster with 4ourMedia managed services when you want campaign planning, ongoing optimization, and growth support.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    'ai marketing services',
                    'social media marketing services',
                    'youtube sponsorship research service',
                    'ecommerce product promo services',
                    'content strategy for online stores',
                    'organic traffic growth services'
                  ].map((keyword, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-6">
                <h3 className="text-xl font-bold text-white">Explore 4ourMedia Services</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  See our full breakdown of services, ideal client profiles, and engagement options built to help brands turn content into consistent sales.
                </p>
                <a
                  href="https://promofinder.4ourmedia.com/services.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition-all hover:bg-indigo-500"
                >
                  Visit AI Marketing Services Page
                  <ArrowRightIcon size={16} />
                </a>
                <p className="text-xs text-slate-500">Opens promofinder.4ourmedia.com in a new tab.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emotional Mid-Page CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-2xl p-10 border border-indigo-500/30 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold font-display">
              Imagine Posting a Promo So Good,<br />
              <span className="text-indigo-300">People Screenshot It to Share Later</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              That's what you get when AI-generated visuals meet copy built for conversion. 
              Your products don't just get seen — the right audience notices them, clicks, and <em>buys</em>.
            </p>
            <button
              onClick={onGetStarted}
              className="btn-primary text-lg px-8 py-4 inline-flex group"
            >
              Try It Free — No Card Required
              <ArrowRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Real Results from Real Marketers
            </h2>
            <p className="text-lg text-slate-400">
              Don't take our word for it — see what happens when people start using PromoGen.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah M.',
                role: 'Etsy Seller',
                AvatarComp: AvatarArtistIcon,
                quote: 'I used to spend nearly 2 hours on a single promo in Canva. Now I generate a full content kit while my coffee brews. The quality is better, and I post far more consistently.',
                highlight: 'Posts more, earns more',
                highlightColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              },
              {
                name: 'Mike R.',
                role: 'Amazon FBA',
                AvatarComp: AvatarMarketerIcon,
                quote: "The AI understands what makes copy convert. The headlines it generates are genuinely compelling — not generic filler. I've tried other tools; this one actually thinks about the buyer.",
                highlight: 'Best ROI of any tool I use',
                highlightColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              },
              {
                name: 'Jessica T.',
                role: 'Marketing Agency',
                AvatarComp: AvatarFounderIcon,
                quote: 'We use the Agency pack across multiple client brands. The white-label export and batch workflow replaced our manual design process for product promos completely. Clients notice the quality.',
                highlight: '20 hrs/week saved',
                highlightColor: 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              }
            ].map((testimonial, i) => (
              <div key={i} className="testimonial-card">
                <div className="flex items-center gap-3 mb-4">
                  <testimonial.AvatarComp size={48} />
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <StarIcon key={j} size={14} color="#FBBF24" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4">"{testimonial.quote}"</p>
                <div className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${testimonial.highlightColor}`}>
                  {testimonial.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full border border-amber-500/30 text-amber-300 text-sm font-medium mb-4">
              <TimerIcon size={16} className="text-amber-400" />
              Pay per generation — no subscription, no lock-in
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-400">
              Buy credits once, use them any time. Standard promo: {FEATURE_PRICING['promo-generation'].creditsRequired} credit. Veo video render: {FEATURE_PRICING['veo-video'].creditsRequired} credits. Credits never expire.
            </p>
          </div>

          {/* Pricing comparison note */}
          <div className="text-center mb-8 text-slate-400 text-sm">
            <p className="flex items-center justify-center gap-2">
              <LightbulbIcon size={16} className="text-amber-400" />
              Compare: Hiring a designer costs $50-200 per promo. PromoGen = <strong className="text-green-400">$0.20-0.36</strong>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(PRICING_PLANS).map((plan) => (
              <div key={plan.id} className={`relative rounded-2xl p-6 border transition-all ${
                plan.popular 
                  ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-indigo-500 scale-105 shadow-xl shadow-indigo-500/20' 
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              }`}>
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full ${
                    plan.popular ? 'bg-indigo-500 text-white' : 
                    plan.badge === 'BEST VALUE' ? 'bg-amber-500 text-black' :
                    'bg-purple-500 text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                  </div>
                  
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-slate-500 line-through text-sm">${plan.originalPrice}</span>
                      <span className="text-green-400 text-sm font-bold">Save {plan.savings}</span>
                    </div>
                  )}
                  
                  {plan.pricePerCredit && (
                    <p className="text-slate-500 text-xs mt-2">{plan.pricePerCredit} per credit</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircleIcon size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => onPurchase(plan.id)}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-white text-indigo-900 hover:bg-slate-100'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <CardIcon size={16} />
                  Buy Now
                </button>
              </div>
            ))}
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <ShieldIcon size={16} className="text-slate-400" />
              Secure Stripe Checkout
            </div>
            <div className="flex items-center gap-2">
              <TrophyIcon size={16} className="text-slate-400" />
              30-Day Money-Back Guarantee
            </div>
            <div className="flex items-center gap-2">
              <SpeedIcon size={16} className="text-slate-400" />
              Instant Delivery
            </div>
            <div className="flex items-center gap-2">
              <LockIcon size={16} className="text-slate-400" />
              Credits Never Expire
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-8 border border-green-700/50">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-3">
              <ROIIcon size={28} className="text-emerald-400" />
              Your ROI Calculator
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-slate-400 mb-2">If you create</p>
                <p className="text-3xl font-bold text-white">10 promos/week</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">Freelance designer cost</p>
                <p className="text-3xl font-bold text-red-400">$500–$2,000</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">PromoGen cost</p>
                <p className="text-3xl font-bold text-green-400">~$2.90</p>
                <p className="text-green-400 text-sm">(10 credits at Pro Pack rate)</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
                <CelebrationIcon size={24} className="text-green-400" />
                Save $497–$1,997 per week
              </p>
              <p className="text-slate-400 mt-2">Versus typical freelance design rates of $50–$200 per promo</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: 'How does the credit system work?',
                a: `Credits are feature-based. Standard promo generations use ${FEATURE_PRICING['promo-generation'].creditsRequired} credit, and Veo video renders use ${FEATURE_PRICING['veo-video'].creditsRequired} credits. Credits are deducted only after successful generation and never expire.`
              },
              {
                q: 'Do credits expire?',
                a: 'No. Credit packs never expire. Use them today, next month, or next year.'
              },
              {
                q: 'What AI powers PromoGen?',
                a: 'PromoGen uses Google Gemini for intelligent product analysis and copywriting, combined with leading image generation models for the visuals. Everything runs server-side — you just paste a URL and get results. No API keys or technical setup required.'
              },
              {
                q: 'Can I use this for client work?',
                a: 'Absolutely! All plans include commercial use. The Agency pack also includes white-label export (no PromoGen branding) for client deliverables.'
              },
              {
                q: "What's the difference between Pro and Agency?",
                a: 'Both plans include all aspect ratios and the same quality per generation. The Pro Pack (100 credits at $29) is ideal for individual marketers and sellers. The Agency Pack (500 credits at $99) offers a significantly lower cost per credit and is built for teams, agencies, or anyone running high-volume campaigns across multiple products or clients.'
              },
              {
                q: "What if I'm not satisfied?",
                a: '30-day money-back guarantee, no questions asked. If PromoGen is not the right fit, email support@4ourmedia.com for a full refund. No forms, no hassle.'
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold hover:bg-slate-700/30 transition-colors">
                  {faq.q}
                  <span className="text-2xl text-slate-500 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-slate-400">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
          
          <div className="mt-8 text-center p-6 bg-slate-800/30 rounded-xl border border-slate-700">
            <p className="text-slate-400 mb-2">Still have questions?</p>
            <a 
              href="mailto:support@4ourmedia.com" 
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              support@4ourmedia.com
            </a>
          </div>
        </div>
      </section>

      {/* Objection Handling Section */}
      <section className="py-16 px-4 bg-slate-800/20">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">
              "But What If It Doesn't Work For My Product?"
            </h2>
            <p className="text-slate-400 text-lg">
              We hear you. Here's why that worry disappears after your first generation:
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                Icon: GlobeIcon,
                iconColor: 'text-blue-400',
                bg: 'from-blue-900/30 to-slate-900',
                border: 'border-blue-700/30',
                title: 'Works With Any Product URL',
                text: 'Amazon, Shopify, Etsy, eBay, your own website. If the page has product information, PromoGen extracts it and builds a promo tailored to that product.'
              },
              {
                Icon: AIBrainIcon,
                iconColor: 'text-violet-400',
                bg: 'from-violet-900/30 to-slate-900',
                border: 'border-violet-700/30',
                title: 'AI Adapts to Your Product',
                text: "It researches your actual product, understands the audience, and writes copy specifically tailored. No generic templates \u2014 every promo is unique."
              },
              {
                Icon: ROIIcon,
                iconColor: 'text-emerald-400',
                bg: 'from-emerald-900/30 to-slate-900',
                border: 'border-emerald-700/30',
                title: 'Try It Free, Right Now',
                text: '3 free generations. No credit card. No account required to start. See a real promo built around your actual product before you spend a single dollar.'
              }
            ].map((item, i) => (
              <div key={i} className={`text-center space-y-4 p-7 rounded-2xl bg-gradient-to-br ${item.bg} border ${item.border}`}>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center">
                  <item.Icon size={28} className={item.iconColor} />
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Article Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-4xl">
          <header className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 text-sm font-medium mb-4">
              Complete Guide
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4 leading-tight">
              The Marketer's Guide to AI Promo Generators in 2026
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Why scroll-stopping visuals matter more than ever, and how AI is making professional-grade promo creation instant and affordable for everyone.
            </p>
          </header>

          <div className="space-y-12 text-slate-300 leading-relaxed">

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                What is an AI Promo Image Generator?
              </h3>
              <p className="mb-4">
                An <strong className="text-white">AI promo image generator</strong> is a tool that uses artificial intelligence to automatically create promotional visuals for products, services, or brands — without requiring any design skills, expensive software, or hours of manual work. You provide a product URL or description, and the AI handles everything else: analyzing the product, writing persuasive copy, selecting a suitable visual style, and composing a finished ad-ready image.
              </p>
              <p>
                PromoGen by 4ourMedia takes this a step further by combining <strong className="text-white">AI copywriting</strong> with <strong className="text-white">psychology-driven visual design</strong>. Every promo it generates includes a conversion-tested headline, an emotion trigger subheading, a clear call-to-action, and a cinematic AI-generated background — all matched to your specific product and target audience.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Why Product Marketers and E-Commerce Sellers Are Switching to AI Ad Makers
              </h3>
              <p className="mb-4">
                The average social media user scrolls through hundreds of posts per day. Research consistently shows you have <strong className="text-white">less than 1.7 seconds</strong> to stop someone's scroll. That window is won or lost entirely by your visual — not your product quality, not your price, not your reviews.
              </p>
              <p className="mb-4">
                Traditional graphic design workflows — hiring a freelancer, using complex tools like Photoshop or Canva, writing copy from scratch — take hours and cost money. For most solo sellers, e-commerce entrepreneurs, and small marketing teams, producing professional promotional content consistently is simply not feasible.
              </p>
              <p>
                AI ad creators like PromoGen collapse that workflow from hours to seconds. Whether you're promoting a product on <strong className="text-white">Amazon, Shopify, Etsy, eBay</strong>, or your own website, an AI promo generator can produce a campaign-ready image faster than you can open a design app.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                How PromoGen Combines AI Copywriting and AI Image Generation
              </h3>
              <p className="mb-4">
                Most AI marketing tools do one thing: either generate images OR write copy. PromoGen does both simultaneously and makes them work together. Here's the pipeline behind every generation:
              </p>
              <ol className="space-y-3 list-none">
                {[
                  ['Product Analysis', 'PromoGen fetches your product URL and uses Google Gemini AI to extract the product name, category, key benefits, target audience, price point, and emotional selling angles.'],
                  ['Psychology-Driven Copywriting', 'Four distinct copy variants are generated, each using a different psychological trigger — urgency, social proof, desire, or curiosity — matched to your product type and buyer persona.'],
                  ['Visual Concept Generation', 'The AI determines the ideal visual mood (aspirational, problem-solving, lifestyle, luxury, etc.) and generates a cinematic background image using leading image generation models.'],
                  ['Composition & Export', 'The headline, subheading, CTA, and product details are composited onto the background in your chosen template and aspect ratio, then exported as a high-resolution PNG ready for any platform.'],
                ].map(([title, text], i) => (
                  <li key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">{i + 1}</span>
                    <div>
                      <span className="font-semibold text-white">{title}: </span>
                      <span>{text}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Best Use Cases: Who Uses AI Promotional Image Generators?
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'E-Commerce Sellers', text: 'Amazon, Shopify, and Etsy sellers use PromoGen to quickly generate platform-optimized product images for listing photos, social proof ads, and promotional campaigns.' },
                  { title: 'Social Media Marketers', text: 'Content creators and social managers use it to produce a week\'s worth of promotional content in minutes, maintaining consistent posting schedules without creative burnout.' },
                  { title: 'Digital Product Creators', text: 'Course creators, SaaS founders, and app developers use PromoGen to build launch assets, webinar promos, and affiliate marketing materials at scale.' },
                  { title: 'Marketing Agencies', text: 'The Agency Pack enables bulk generation for multiple clients simultaneously, cutting creative production time from days to hours and dramatically improving margins.' },
                  { title: 'Local Businesses', text: 'Restaurants, salons, gyms, and retail shops use PromoGen to create professional-looking promotional images for sales events, new products, and seasonal campaigns.' },
                  { title: 'Affiliate Marketers', text: 'Affiliates generate custom promo images for products they\'re promoting, giving reviews and landing pages a polished, high-conversion look without any design work.' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                AI Promo Generator vs Canva vs Hiring a Designer: A Real Comparison
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/80">
                      <th className="text-left p-4 text-white font-semibold">Factor</th>
                      <th className="text-center p-4 text-indigo-300 font-semibold">PromoGen AI</th>
                      <th className="text-center p-4 text-slate-400 font-semibold">Canva</th>
                      <th className="text-center p-4 text-slate-400 font-semibold">Freelance Designer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {[
                      ['Time to first promo', '~10 seconds', '30–60 minutes', '1–3 days'],
                      ['Design skills needed', 'None', 'Moderate', 'None (you hire it out)'],
                      ['Copywriting included', '✔ AI-written, psych-driven', '✗ You write it', 'Sometimes (+$$)'],
                      ['Cost per promo', '~$0.20–$0.36', '$0 (but your time)', '$50–$200+'],
                      ['Custom AI visuals', '✔ Unique per product', '✗ Stock templates', 'Varies'],
                      ['Bulk workflow support', '✔ Agency plan', '✗', '✗ (slow & expensive)'],
                      ['Psychology optimization', '✔ Built-in', '✗', 'Depends on skill'],
                    ].map(([factor, pg, canva, designer], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-slate-800/20' : ''}>
                        <td className="p-4 text-slate-300 font-medium">{factor}</td>
                        <td className="p-4 text-center text-indigo-300 font-medium">{pg}</td>
                        <td className="p-4 text-center text-slate-400">{canva}</td>
                        <td className="p-4 text-center text-slate-400">{designer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Free AI Marketing Tools: What 4ourMedia Offers Beyond PromoGen
              </h3>
              <p className="mb-4">
                Looking for hands-on execution instead of DIY software? Explore our <a href="https://promofinder.4ourmedia.com/services.html" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">AI marketing services for brands, creators, and ecommerce teams</a> to get strategy and implementation support.
              </p>
              <p className="mb-4">
                Beyond PromoGen, 4ourMedia operates a completely free suite of <strong className="text-white">YouTube intelligence and sponsorship research tools</strong> at <a href="https://promofinder.4ourmedia.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">promofinder.4ourmedia.com</a>. These nine free tools help creators, brands, and marketers understand the YouTube sponsorship landscape:
              </p>
              <ul className="space-y-2 text-slate-400">
                {[
                  'YouTube Promo Finder — discover which channels are currently being sponsored and by whom',
                  'Domain Search — find sponsor websites linked in video descriptions at scale',
                  'Unlisted Video Finder — surface hidden promotional content that standard tools miss',
                  'Channel Growth Tracker — identify fast-growing channels before they become expensive to sponsor',
                  'Collaboration Finder — discover creator collaboration networks and cross-promotion opportunities',
                  'Compare Sponsors — benchmark competing brands\' influencer strategies side by side',
                  'Sponsorship Rate Estimator — estimate fair market rates before you negotiate',
                  'Viral Video Detector — catch trending content early for timely sponsorship deals',
                  'Sponsor Saturation Score — measure how over-sponsored a niche is before you enter it',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 mt-1 flex-shrink-0">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                All tools are free to use with no account required — a resource for anyone doing YouTube marketing research.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
              <h3 className="text-xl font-bold text-white mb-3">
                Key Takeaway: The Best AI Promo Generator Is the One You'll Actually Use
              </h3>
              <p className="text-slate-400">
                The most sophisticated design tool in the world is useless if the learning curve stops you from shipping content. PromoGen is built around one principle: <strong className="text-white">zero friction from idea to published promo</strong>. Paste a URL, get a promo. No tutorials, no templates to edit, no copy to agonize over. Just results — in the time it takes to make a coffee.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-6">
            <SparklesIcon size={16} className="text-emerald-400" />
            Start free — 3 generations, no credit card required
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 leading-tight">
            Your Product Deserves<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              a Promo That Actually Sells.
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">
            The product is already good. What's been missing is a promo that communicates its value 
            with the visuals and copy that make people stop, click, and buy.
          </p>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto font-medium">
            Your first 3 promos are completely free. See exactly what PromoGen builds for your product.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="btn-primary text-xl px-10 py-5 inline-flex group"
            >
              <SparklesIcon size={24} />
              Create My First Promo Free
            </button>
            <button
              onClick={() => onPurchase('pro')}
              className="btn-gold text-xl px-10 py-5 font-bold inline-flex"
            >
              Get 100 Credits — $29
            </button>
          </div>
          
          <p className="text-slate-500 text-sm mt-6">
            No credit card required &bull; 30-day money-back guarantee &bull; Credits never expire
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <SparklesIcon size={20} className="text-indigo-400" />
              <span className="font-bold text-white">4ourMedia PromoGen</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => onNavigate?.('privacy')} className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => onNavigate?.('terms')} className="hover:text-slate-300 transition-colors">
                Terms of Service
              </button>
              <button onClick={() => onNavigate?.('refund')} className="hover:text-slate-300 transition-colors">
                Refund Policy
              </button>
              <button onClick={() => onNavigate?.('contact')} className="hover:text-slate-300 transition-colors">
                Contact
              </button>
            </div>
            <div>
              © {new Date().getFullYear()} 4ourMedia. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Exit Intent Popup */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full relative border border-slate-700">
            <button 
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <CloseIcon size={24} />
            </button>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <GiftIcon size={36} className="text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Before you go — try it free</h3>
              <p className="text-slate-400 mb-6">
                You get <span className="text-green-400 font-bold">3 free generations</span> with no commitment — no credit card, no account needed. See what PromoGen builds for your actual product first.
              </p>
              
              <button
                onClick={() => {
                  setShowExitIntent(false);
                  onGetStarted();
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl transition-all"
              >
                Try Free — No Card Required
              </button>
              
              <button
                onClick={() => setShowExitIntent(false)}
                className="mt-4 text-slate-500 text-sm hover:text-slate-300"
              >
                No thanks, I'll come back later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

