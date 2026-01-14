import React from 'react';
import { 
  Sparkles, Zap, Clock, Target, Shield, TrendingUp, 
  CheckCircle, Star, ArrowRight, Play, Users, Award,
  Palette, Brain, Download, Globe, Mail
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onPurchase: () => void;
  isDemoMode: boolean;
  onNavigate?: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onPurchase, isDemoMode, onNavigate }) => {
  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-slate-900"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Marketing Tool
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200">
                  Stop Designing.
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Start Converting.
                </span>
              </h1>
              
              <p className="text-xl text-slate-300 max-w-xl">
                Turn any product URL into a <strong className="text-white">scroll-stopping promo</strong> in seconds. 
                Our AI researches your product, writes conversion copy, and designs stunning visuals—automatically.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 group"
                >
                  Try It Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                {isDemoMode && (
                  <button
                    onClick={onPurchase}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Get Unlimited Access
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-6 pt-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  No credit card required
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
                {/* Phone Mockup */}
                <div className="relative aspect-[9/16] bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-2 shadow-2xl ring-1 ring-white/10">
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl overflow-hidden flex flex-col justify-end p-6">
                    {/* Mock Content */}
                    <div className="space-y-3">
                      <div className="w-20 h-6 bg-indigo-500 rounded-full mx-auto animate-pulse"></div>
                      <div className="w-48 h-8 bg-white/90 rounded mx-auto"></div>
                      <div className="w-32 h-4 bg-indigo-400/60 rounded mx-auto"></div>
                      <div className="w-40 h-3 bg-white/40 rounded mx-auto"></div>
                      <div className="flex justify-center gap-1 pt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg animate-bounce">
                  AI Generated!
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-slate-800/50 border-y border-slate-700/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-white font-bold">2,500+</span> Marketers
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <span className="text-white font-bold">50,000+</span> Promos Created
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-white font-bold">10 sec</span> Average Time
            </div>
            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-white font-bold ml-1">4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Creating Promos Shouldn't Take Hours
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              You're losing sales while struggling with design tools and copywriting. 
              There's a better way.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2">
                <span className="text-2xl">😩</span> The Old Way
              </h3>
              <ul className="space-y-4">
                {[
                  'Hours wasted on Canva or Photoshop',
                  'Hiring expensive designers ($50-500/promo)',
                  'Writer\'s block on headlines',
                  'Inconsistent brand quality',
                  'No time for A/B testing'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <span className="text-red-400 mt-1">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* The PromoGen Way */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                <span className="text-2xl">🚀</span> The PromoGen Way
              </h3>
              <ul className="space-y-4">
                {[
                  'Professional promos in 10 seconds',
                  'One-time price, unlimited promos',
                  'AI writes conversion-optimized copy',
                  'Consistent, on-brand every time',
                  'Generate variations instantly'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-slate-800/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              3 Steps to Viral-Ready Promos
            </h2>
            <p className="text-xl text-slate-400">
              From URL to stunning promo in seconds. No design skills needed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Globe,
                title: 'Paste Your Link',
                description: 'Drop any product URL from Amazon, Shopify, your website—anywhere. Our AI fetches all the details.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Does the Work',
                description: 'Using advanced psychology, it writes compelling headlines, picks colors that convert, and generates stunning visuals.',
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '03',
                icon: Download,
                title: 'Download & Post',
                description: 'Get a ready-to-post 9:16 promo image. Add your logo, customize the URL, and download in one click.',
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

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Built for Marketers Who Convert
            </h2>
            <p className="text-xl text-slate-400">
              Every feature designed to maximize your sales
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Psychology-Driven Copy',
                description: 'Headlines and CTAs based on proven persuasion principles: FOMO, social proof, urgency.'
              },
              {
                icon: Palette,
                title: 'Color Psychology',
                description: 'AI picks colors that trigger the right emotions—red for urgency, blue for trust, gold for premium.'
              },
              {
                icon: Target,
                title: 'Emotional Targeting',
                description: 'Targets core buying emotions: desire for status, fear of missing out, pursuit of pleasure.'
              },
              {
                icon: Zap,
                title: '10-Second Generation',
                description: 'No more waiting. Get professional-quality promos faster than you can sip your coffee.'
              },
              {
                icon: Shield,
                title: 'Your Brand, Your API',
                description: 'Full control with your own Gemini API key. Your data never touches our servers.'
              },
              {
                icon: TrendingUp,
                title: 'Conversion Optimized',
                description: 'Every element positioned for maximum impact—CTA badges, social proof, urgency copy.'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 hover:border-indigo-500/50 transition-colors group">
                <feature.icon className="w-10 h-10 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-900/30 via-slate-900 to-purple-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Loved by Marketers Worldwide
            </h2>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="ml-2 text-slate-300">4.9/5 from 500+ reviews</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah M.',
                role: 'E-commerce Owner',
                avatar: '👩‍💼',
                quote: 'I used to spend $200/month on designers. PromoGen paid for itself in a single day. My conversion rate jumped 34%.',
                highlight: '34% more conversions'
              },
              {
                name: 'Marcus T.',
                role: 'Dropshipper',
                avatar: '👨‍💻',
                quote: 'The AI copy is scary good. It knows exactly what makes people click. I\'ve 10x\'d my product launches.',
                highlight: '10x product launches'
              },
              {
                name: 'Jennifer K.',
                role: 'Marketing Agency',
                avatar: '👩‍🎨',
                quote: 'We use this for all our clients now. What took 2 hours now takes 10 seconds. Our clients think we\'re geniuses.',
                highlight: '2 hours → 10 seconds'
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Simple, One-Time Pricing
            </h2>
            <p className="text-xl text-slate-400">
              No subscriptions. No hidden fees. Pay once, use forever.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-700 relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-bl-2xl">
              MOST POPULAR
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">Lifetime License</h3>
                <div className="flex items-baseline gap-2 justify-center md:justify-start mb-4">
                  <span className="text-5xl font-bold text-white">$49</span>
                  <span className="text-slate-400 line-through">$199</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">75% OFF</span>
                </div>
                <p className="text-slate-400 mb-6">One payment. Unlimited promos. Forever.</p>
                
                <ul className="space-y-3 text-left">
                  {[
                    'Unlimited promo generations',
                    'All future updates included',
                    'Use your own Gemini API key',
                    'Full customization options',
                    'Priority email support',
                    'Commercial use license'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex-shrink-0">
                <button
                  onClick={onPurchase}
                  className="px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transition-all flex items-center gap-3"
                >
                  Get Lifetime Access
                  <ArrowRight className="w-6 h-6" />
                </button>
                <p className="text-center text-sm text-slate-500 mt-3">
                  30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure Stripe Checkout
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              30-Day Guarantee
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Instant Delivery
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
                q: 'Do I need design skills to use this?',
                a: 'Absolutely not! Just paste a URL and the AI handles everything—research, copywriting, design, and branding. It\'s like having a marketing team in your pocket.'
              },
              {
                q: 'What\'s a Gemini API key and how do I get one?',
                a: 'Google Gemini is the AI that powers the tool. You can get a free API key from Google AI Studio in under 2 minutes. We provide step-by-step instructions during setup.'
              },
              {
                q: 'Is there really no subscription?',
                a: 'Correct! Pay once, use forever. The only ongoing cost is your Gemini API usage, which is very cheap (typically $0.001-0.01 per promo).'
              },
              {
                q: 'Can I use this for client work?',
                a: 'Yes! The lifetime license includes commercial use rights. Use it for your own products, clients, agencies—whatever you need.'
              },
              {
                q: 'What if I\'m not satisfied?',
                a: 'We offer a 30-day money-back guarantee, no questions asked. If it\'s not for you, just email us for a full refund.'
              },
              {
                q: 'What image format and size do I get?',
                a: 'All promos are generated at 1080x1920 (9:16 ratio) in PNG format—perfect for Instagram Stories, TikTok, Reels, and any vertical content.'
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
          
          {/* Still have questions */}
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

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
            Ready to Create Promos That Convert?
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Join 2,500+ marketers who stopped wasting time on design and started focusing on sales.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-3"
            >
              <Sparkles className="w-6 h-6" />
              Try 3 Free Generations
            </button>
            <button
              onClick={onPurchase}
              className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xl rounded-2xl border border-white/20 transition-all"
            >
              Get Unlimited — $49
            </button>
          </div>
          
          <p className="text-slate-500 text-sm mt-6">
            No credit card required for free trial • 30-day money-back guarantee
          </p>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
