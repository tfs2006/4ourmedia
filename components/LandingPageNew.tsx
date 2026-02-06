import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Zap, Clock, Target, Shield, TrendingUp, 
  CheckCircle, Star, ArrowRight, Play, Users, Award,
  Palette, Brain, Download, Globe, Mail, Crown,
  Layers, Image, Package, Infinity, Timer, Gift,
  AlertTriangle, ChevronDown, X, CreditCard, Lock
} from 'lucide-react';

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

// Pricing Plans Data
const PRICING_PLANS: Record<string, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 25,
    price: 9,
    pricePerCredit: '$0.36',
    description: 'Perfect for trying out the full power',
    popular: false,
    badge: null,
    features: [
      '25 promo generations',
      '2 templates included',
      'Story size (9:16)',
      'Never expires'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    price: 29,
    originalPrice: 36,
    pricePerCredit: '$0.29',
    description: 'Best value for serious marketers',
    popular: true,
    badge: 'MOST POPULAR',
    savings: '19%',
    features: [
      '100 promo generations',
      '8 premium templates',
      'All export sizes (6 formats)',
      'Priority generation queue',
      'Never expires'
    ]
  },
  agency: {
    id: 'agency',
    name: 'Agency Pack',
    credits: 500,
    price: 99,
    originalPrice: 180,
    pricePerCredit: '$0.20',
    description: 'For teams and agencies',
    popular: false,
    badge: 'BEST VALUE',
    savings: '45%',
    features: [
      '500 promo generations',
      '12 templates (inc. exclusive)',
      'All export sizes',
      'Priority queue',
      'Bulk generation (10 at once)',
      'White-label export',
      'Never expires'
    ]
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    credits: -1,
    price: 19,
    interval: '/month',
    description: 'Unlimited for power users',
    popular: false,
    badge: 'UNLIMITED',
    features: [
      'Unlimited generations',
      'All 12 templates',
      'All export sizes',
      'Priority queue',
      'Bulk generation (25 at once)',
      'White-label export',
      'Cancel anytime'
    ]
  }
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase, onNavigate }) => {
  // Urgency countdown (resets daily)
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // Set countdown to end of day
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    // Simulated live visitor count (for social proof)
    setVisitorCount(Math.floor(Math.random() * 20) + 35);
    const visitorTimer = setInterval(() => {
      setVisitorCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 8000);

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !localStorage.getItem('exitIntentShown')) {
        setShowExitIntent(true);
        localStorage.setItem('exitIntentShown', 'true');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearInterval(timer);
      clearInterval(visitorTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="min-h-screen">
      
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 px-4 text-center text-sm font-medium">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4 animate-pulse" />
            Launch Week Special Ends In:
          </span>
          <span className="font-mono font-bold">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1 text-yellow-200">
            <Users className="w-4 h-4" />
            {visitorCount} people viewing right now
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-28 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 text-green-300 text-sm font-medium">
                <Gift className="w-4 h-4" />
                Launch Week: Extra 20% Credits FREE
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200">
                  Your Product Deserves
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Better Than a Boring Photo.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-xl leading-relaxed">
                Paste any product URL. In <strong className="text-white">10 seconds</strong>, get a 
                <strong className="text-white"> scroll-stopping promo</strong> with AI-written headlines, 
                psychology-driven copy, and cinematic visuals that make people <em>stop, stare, and buy</em>.
              </p>

              <p className="text-base text-slate-400 max-w-lg">
                No Photoshop. No copywriter. No waiting 3 days for a freelancer. 
                Just paste, click, and post — while your competitors are still drafting briefs.
              </p>

              {/* Value Props */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: Zap, text: '10-second generation' },
                  { icon: Brain, text: 'Psychology-driven copy' },
                  { icon: Layers, text: '12 pro templates' },
                  { icon: Image, text: '4 export sizes' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <item.icon className="w-4 h-4 text-indigo-400" />
                    {item.text}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 group"
                >
                  Create My First Promo Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  View Pricing
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-6 pt-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  No credit card needed
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  3 free generations
                </div>
              </div>
            </div>
            
            {/* Right: Hero Image Preview */}
            <div className="flex-1 relative">
              <div className="relative w-full max-w-sm mx-auto">
                {/* Before/After comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Before */}
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 text-center">BEFORE</p>
                    <div className="aspect-[9/16] bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-center">
                      <div className="text-center text-slate-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Boring product photo</p>
                        <p className="text-[10px] mt-1 text-slate-600">Gets scrolled past</p>
                      </div>
                    </div>
                    <p className="text-xs text-red-400 text-center">0 engagement 😢</p>
                  </div>
                  
                  {/* After */}
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-400 text-center font-bold">AFTER ✨</p>
                    <div className="aspect-[9/16] bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-xl p-3 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20 overflow-hidden flex flex-col justify-end">
                      <div className="space-y-2">
                        <div className="w-16 h-5 bg-emerald-500 rounded-full mx-auto"></div>
                        <div className="w-full h-6 bg-white/90 rounded"></div>
                        <div className="w-3/4 h-3 bg-indigo-400/60 rounded mx-auto"></div>
                        <div className="flex justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-400 text-center font-bold">10x more clicks! 🚀</p>
                  </div>
                </div>
                
                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                  AI-Powered
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 px-4 bg-slate-800/50 border-y border-slate-700">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span><strong className="text-white">2,847</strong> marketers using PromoGen</span>
            </div>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-400" />
              <span><strong className="text-white">48,293</strong> promos generated</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
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
            Meanwhile, that other seller — selling the <em>same exact product</em> — is 
            getting thousands of clicks because their visuals <em>demand</em> attention.
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
                <X className="w-5 h-5" /> What Most Sellers Do (And Why They Struggle)
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
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-red-300/70 text-sm italic">
                Sound familiar? You're not alone — 89% of sellers say creating promotional content is their #1 bottleneck.
              </p>
            </div>
            
            {/* Solution */}
            <div className="bg-emerald-950/30 rounded-2xl p-8 border border-emerald-900/50">
              <h3 className="text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> What Smart Marketers Do Instead
              </h3>
              <ul className="space-y-4 text-slate-300">
                {[
                  'Paste a URL → Get a stunning promo in 10 seconds',
                  'AI writes headlines using proven psychology triggers',
                  'Pay $0.20-0.36 per promo — less than a cup of coffee',
                  'Choose from 4 sizes: Story, Square, Landscape, Instagram',
                  'Post confidently knowing the copy was built to convert'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
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
                emoji: '🛒',
                title: 'E-Commerce Sellers',
                description: 'Amazon FBA, Shopify, Etsy, eBay — turn any product listing into a conversion machine.',
              },
              {
                emoji: '📱',
                title: 'Social Media Marketers',
                description: 'Create thumb-stopping Instagram, TikTok, and Facebook ads without touching Photoshop.',
              },
              {
                emoji: '🏢',
                title: 'Agencies & Freelancers',
                description: 'Deliver client creatives in minutes, not days. White-label, bulk generate, and scale.',
              },
              {
                emoji: '🚀',
                title: 'Founders & Solopreneurs',
                description: 'You wear 10 hats already. Let AI handle design so you can focus on selling.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-indigo-500/50 transition-all group text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{item.emoji}</div>
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
                icon: Globe,
                title: 'Paste Your Link',
                description: 'Drop any product URL—Amazon, Shopify, your website. Our AI fetches all the details.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Does the Work',
                description: 'Psychology-driven headlines, emotion-matched colors, and stunning AI-generated backgrounds.',
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '03',
                icon: Download,
                title: 'Download & Post',
                description: 'Get ready-to-post images in 6 sizes. Add your logo, download, and watch engagement soar.',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((item, i) => (
              <div key={i} className="relative bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-colors group">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-600">
                  {item.step}
                </div>
                <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400">{item.description}</p>
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
              12 Conversion-Optimized Templates
            </h2>
            <p className="text-xl text-slate-400">
              Every template designed by marketing psychologists to maximize clicks
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Classic', emoji: '🎯', tier: 'Free' },
              { name: 'Minimal', emoji: '✨', tier: 'Free' },
              { name: 'Flash Sale', emoji: '⚡', tier: 'Pro', locked: true },
              { name: 'Luxury', emoji: '👑', tier: 'Pro', locked: true },
              { name: 'Launch', emoji: '🚀', tier: 'Pro', locked: true },
              { name: 'Social Proof', emoji: '⭐', tier: 'Pro', locked: true },
              { name: 'Black Friday', emoji: '🖤', tier: 'Pro', locked: true },
              { name: 'Tech Modern', emoji: '💻', tier: 'Agency', locked: true },
              { name: 'Beauty Glow', emoji: '💄', tier: 'Agency', locked: true },
              { name: 'Fitness', emoji: '💪', tier: 'Agency', locked: true },
              { name: 'White Label', emoji: '⬜', tier: 'Agency', locked: true },
              { name: '+More', emoji: '🎁', tier: 'Coming', locked: true }
            ].map((template, i) => (
              <div key={i} className={`relative aspect-[3/4] rounded-xl flex flex-col items-center justify-center p-4 border transition-all ${
                template.locked 
                  ? 'bg-slate-800/30 border-slate-700 opacity-75' 
                  : 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/50 hover:scale-105'
              }`}>
                {template.locked && (
                  <Lock className="absolute top-2 right-2 w-4 h-4 text-slate-500" />
                )}
                <span className="text-4xl mb-2">{template.emoji}</span>
                <span className="text-sm font-medium text-center">{template.name}</span>
                <span className={`text-xs mt-1 ${
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
                icon: Brain,
                title: 'Headlines That Hijack Attention',
                description: 'The AI uses FOMO, social proof, urgency, and desire triggers — the same psychology used by billion-dollar brands — to write copy that makes people stop scrolling.'
              },
              {
                icon: Palette,
                title: 'Colors That Trigger Buying',
                description: 'Red for urgency. Gold for premium. Blue for trust. The AI matches colors to the emotional tone of your product — because color alone can boost conversions by 80%.'
              },
              {
                icon: Layers,
                title: 'Templates Designed to Convert',
                description: 'Every template was built by studying top-performing ads. From flash sales to luxury launches — pick the one that fits your campaign and let the AI do the rest.'
              },
              {
                icon: Image,
                title: '4 Sizes, One Click',
                description: 'Story (9:16), Square (1:1), Landscape (16:9), Instagram (4:5) — generate the perfect size for any platform without cropping, stretching, or redesigning.'
              },
              {
                icon: Zap,
                title: 'Faster Than Your Competition',
                description: 'While they\'re spending 2 hours per creative, you\'re generating 10 promos in 2 minutes. Speed is a competitive advantage — and now it\'s yours.'
              },
              {
                icon: Target,
                title: 'AI Audience Insights',
                description: 'Get instant breakdowns of your ideal buyer: demographics, pain points, desires, and buying triggers. Know your customer better than they know themselves.'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-colors group">
                <feature.icon className="w-10 h-10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Mid-Page CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-2xl p-10 border border-indigo-500/30 text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold font-display">
              Imagine Posting a Promo So Good,<br />
              <span className="text-indigo-300">People Screenshot It to Buy Later</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              That's what happens when you combine cinematic AI visuals with copy written by an AI 
              trained on the psychology of persuasion. Your products don't just get seen — they get <em>desired</em>.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2 group"
            >
              Try It Free — No Card Required
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                avatar: '👩‍💼',
                quote: 'I used to spend 2 hours per promo in Canva. Now I generate 10 in the time it takes to drink my coffee. My click-through rate went up 340%!',
                highlight: '+340% CTR'
              },
              {
                name: 'Mike R.',
                role: 'Amazon FBA',
                avatar: '👨‍💻',
                quote: 'The AI understands conversion psychology better than most marketers. The headlines it writes are genuinely compelling. Worth every penny.',
                highlight: '5x ROI in week 1'
              },
              {
                name: 'Jessica T.',
                role: 'Marketing Agency',
                avatar: '👩‍🎨',
                quote: 'We use the Agency pack for client work. The white-label option and bulk generation save us 20+ hours per week. Clients love the results.',
                highlight: '20 hrs/week saved'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4">"{testimonial.quote}"</p>
                <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm font-bold rounded-full">
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
              <Timer className="w-4 h-4" />
              Launch Week: Extra 20% Credits on Pro & Agency packs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-400">
              Pay per promo. No subscriptions required. Credits never expire.
            </p>
          </div>

          {/* Pricing comparison note */}
          <div className="text-center mb-8 text-slate-400 text-sm">
            <p>💡 Compare: Hiring a designer costs $50-200 per promo. PromoGen = <strong className="text-green-400">$0.20-0.36</strong></p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    {plan.interval && <span className="text-slate-400">{plan.interval}</span>}
                  </div>
                  
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-slate-500 line-through text-sm">${plan.originalPrice}</span>
                      <span className="text-green-400 text-sm font-bold">Save {plan.savings}</span>
                    </div>
                  )}
                  
                  {plan.pricePerCredit && (
                    <p className="text-slate-500 text-xs mt-2">{plan.pricePerCredit} per promo</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
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
                  <CreditCard className="w-4 h-4" />
                  {plan.interval ? 'Subscribe' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure Stripe Checkout
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              30-Day Money-Back Guarantee
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Instant Delivery
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Credits Never Expire
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-8 border border-green-700/50">
            <h3 className="text-2xl font-bold text-center mb-6">💰 Your ROI Calculator</h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-slate-400 mb-2">If you create</p>
                <p className="text-3xl font-bold text-white">10 promos/week</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">Designer cost would be</p>
                <p className="text-3xl font-bold text-red-400">$500-2,000</p>
              </div>
              <div>
                <p className="text-slate-400 mb-2">PromoGen cost</p>
                <p className="text-3xl font-bold text-green-400">$2.90</p>
                <p className="text-green-400 text-sm">(Pro Pack)</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-2xl font-bold text-green-400">
                Save $497-1,997 per week 🎉
              </p>
              <p className="text-slate-400 mt-2">That's up to $103,844 per year in savings</p>
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
                a: '1 credit = 1 promo generation. Buy credits in packs (they never expire) or subscribe to Unlimited for infinite generations. Credits are deducted only after successful generation.'
              },
              {
                q: 'Do credits expire?',
                a: 'No! Credit packs never expire. Use them whenever you want—today, next month, or next year. Only the Unlimited subscription requires monthly renewal.'
              },
              {
                q: 'What\'s a Gemini API key and is it free?',
                a: 'Google Gemini is the AI that powers generation. You can get a free API key from Google AI Studio in 2 minutes. The API cost is minimal (about $0.002 per promo)—far less than our credit price, which covers our service, templates, and support.'
              },
              {
                q: 'Can I use this for client work?',
                a: 'Absolutely! All plans include commercial use. The Agency pack also includes white-label export (no PromoGen branding) for client deliverables.'
              },
              {
                q: 'What\'s the difference between Pro and Agency?',
                a: 'Pro is perfect for individual marketers (100 credits, 8 templates, all sizes). Agency adds bulk generation (10 at once), white-label export, and exclusive templates—ideal for teams creating high volume.'
              },
              {
                q: 'What if I\'m not satisfied?',
                a: '30-day money-back guarantee, no questions asked. If PromoGen isn\'t for you, email us for a full refund. We\'ve had less than 1% refund rate because it actually works.'
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
                emoji: '🎯',
                title: 'Works With Any URL',
                text: 'Amazon, Shopify, Etsy, eBay, your own website, even a Notion page. If it has a URL, PromoGen can turn it into a promo.'
              },
              {
                emoji: '🧠',
                title: 'AI Adapts to Your Product',
                text: 'It researches your actual product, understands the audience, and writes copy specifically tailored. No generic templates — every promo is unique.'
              },
              {
                emoji: '💰',
                title: 'Risk-Free to Try',
                text: '3 free generations. No credit card. Try it right now and see if the results blow your mind. We think they will.'
              }
            ].map((item, i) => (
              <div key={i} className="text-center space-y-3 p-6">
                <div className="text-4xl">{item.emoji}</div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30 text-red-300 text-sm font-medium mb-6">
            <Timer className="w-4 h-4 animate-pulse" />
            Launch Week ends in {timeLeft.hours}h {timeLeft.minutes}m
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-6 leading-tight">
            Every Minute You Wait,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Someone Else Gets the Click.
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">
            Your product is already good enough. It just needs the promo it deserves. 
            One that makes people feel something. One that stops the scroll.
          </p>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto font-medium">
            Your first 3 promos are on us. See for yourself.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Create My First Promo Free
            </button>
            <button
              onClick={() => onPurchase('pro')}
              className="px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transition-all"
            >
              Go Pro — $29 for 100 Promos
            </button>
          </div>
          
          <p className="text-slate-500 text-sm mt-6">
            No credit card required • 30-day money-back guarantee • Credits never expire
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
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
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold mb-2">Wait! Special Offer</h3>
              <p className="text-slate-400 mb-6">
                Get <span className="text-green-400 font-bold">5 extra credits FREE</span> when you purchase any pack in the next 10 minutes!
              </p>
              
              <button
                onClick={() => {
                  setShowExitIntent(false);
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg rounded-xl transition-all"
              >
                Claim My Bonus
              </button>
              
              <button
                onClick={() => setShowExitIntent(false)}
                className="mt-4 text-slate-500 text-sm hover:text-slate-300"
              >
                No thanks, I'll pay full price later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
