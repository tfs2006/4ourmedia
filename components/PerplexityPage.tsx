import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle, ExternalLink, Zap, Shield,
  Globe, Brain, BarChart3, Search, ArrowRight
} from 'lucide-react';
import { SparklesIcon } from './Icons';

interface PerplexityPageProps {
  onBack: () => void;
}

const AFFILIATE_URL = 'https://pplx.ai/chloeandis29106';

const features = [
  {
    icon: Globe,
    title: 'Real-Time Web Search',
    description:
      'Unlike ChatGPT, Comet searches the live web in real-time — so every answer is backed by current data, not a training cutoff from months ago.',
  },
  {
    icon: Brain,
    title: 'GPT-4o + Claude 3 Built In',
    description:
      "Access the world's best AI models directly inside your browser. Switch between them depending on the task — no separate subscriptions required.",
  },
  {
    icon: CheckCircle,
    title: 'Verified Citations on Every Answer',
    description:
      'Every claim Comet makes comes with a verifiable source. No hallucinations. No guessing. Pitch with confidence knowing your data is real.',
  },
  {
    icon: BarChart3,
    title: 'Market Intelligence in Seconds',
    description:
      'Need competitor analysis? Market sizing? Trend reports? Comet scans thousands of sources and synthesizes a clear brief — in the time it takes to make coffee.',
  },
  {
    icon: Search,
    title: 'Competitor Analysis Automation',
    description:
      "Ask Comet to pull pricing strategies, G2 reviews, or market share data for any competitor. It's a full research team living in your toolbar.",
  },
  {
    icon: Shield,
    title: 'Privacy-First Browsing',
    description:
      'Your research is yours. Comet is built with privacy at its core so you can investigate sensitive topics without being tracked by ad networks.',
  },
];

const comparison = [
  { feature: 'Real-time web access', comet: true, chatgpt: '⚠️ Limited', google: true },
  { feature: 'Source citations', comet: true, chatgpt: false, google: '⚠️ Links only' },
  { feature: 'GPT-4o + Claude 3', comet: true, chatgpt: '⚠️ GPT-4 only', google: false },
  { feature: 'Direct answers (no link-clicking)', comet: true, chatgpt: true, google: false },
  { feature: 'Business research focus', comet: true, chatgpt: '⚠️ General', google: '⚠️ Manual' },
  { feature: 'Price', comet: 'FREE via 4ourMedia', chatgpt: '$20/mo', google: 'Free' },
];

const Cell: React.FC<{ value: boolean | string }> = ({ value }) => {
  if (value === true) return <span className="text-green-400 font-semibold">✅ Yes</span>;
  if (value === false) return <span className="text-slate-500">❌ No</span>;
  return <span className="text-slate-300 text-sm">{value}</span>;
};

const PerplexityPage: React.FC<PerplexityPageProps> = ({ onBack }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is Perplexity Comet?',
      a: "Perplexity Comet is an AI-powered web browser developed by Perplexity AI. It integrates their answer engine directly into your browsing experience, letting you research topics, analyze competitors, and get cited answers without leaving your workflow.",
    },
    {
      q: 'Is it really free?',
      a: "Yes — the browser is free. By downloading through our exclusive 4ourMedia link, you also unlock Perplexity Pro features (normally $20/month) at zero cost. No credit card required.",
    },
    {
      q: "How is it different from ChatGPT?",
      a: "ChatGPT has a training data cutoff and can't access current web content. Comet searches the live web in real-time and cites every source — critical for business research, market analysis, and fact-checking.",
    },
    {
      q: 'How do I get Perplexity Pro for free?',
      a: "Download Comet through the link on this page. Perplexity is aggressively growing their browser user base and offering Pro access as an incentive. Take advantage while it lasts.",
    },
    {
      q: 'How much time does it actually save?',
      a: "Knowledge workers spend an average of 9.3 hours per week searching for information. Users report saving 5–10 hours weekly. At $50/hour that's over $13,000/year in reclaimed productivity — for a free tool.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to PromoGen
          </button>
          <a
            href={AFFILIATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all text-sm"
          >
            <Zap className="w-4 h-4" />
            Get Comet Free
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/30 to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative container mx-auto max-w-5xl">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            {/* Left */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                <SparklesIcon size={14} className="text-indigo-400" /> Exclusive Free Access via 4ourMedia
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200">
                  Stop Searching.
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Start Executing.
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-xl">
                Meet <strong className="text-white">Perplexity Comet</strong>, the AI browser that turns
                the web into your personal{' '}
                <strong className="text-white">Market Intelligence Engine</strong>. Automate research,
                analyze competitors, and unlock{' '}
                <strong className="text-indigo-300">Perplexity Pro for FREE</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-start">
                <a
                  href={AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 transition-all group"
                >
                  Download Comet Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <p className="text-slate-500 text-sm">🎁 Exclusive Pro Offer Applied · No Credit Card</p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm justify-center lg:justify-start">
                {['10x Faster Insights', 'Pro Access FREE', '24/7 AI Analyst'].map(stat => (
                  <div key={stat} className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {stat}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mockup */}
            <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
              <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-indigo-900/40">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-700">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-md px-3 py-1 text-xs text-slate-400 text-center">
                    perplexity.ai/comet
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm flex-shrink-0">🤖</div>
                    <div className="bg-slate-700 rounded-xl rounded-tl-none px-4 py-3 text-sm text-slate-200 leading-relaxed">
                      "I analyzed the top 5 competitors in the SaaS CRM space. Want a feature comparison matrix?"
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-indigo-600/30 border border-indigo-500/30 rounded-xl rounded-tr-none px-4 py-3 text-sm text-slate-200 leading-relaxed max-w-xs">
                      "Yes — and find the biggest gap in their pricing."
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm flex-shrink-0">☄️</div>
                    <div className="bg-slate-700 border border-indigo-500/20 rounded-xl rounded-tl-none px-4 py-3 text-sm text-slate-200 leading-relaxed">
                      <strong className="text-white">Analysis Complete:</strong> Data shows a 40% gap in mid-market tier pricing with 3 verifiable sources...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Banner */}
      <section className="py-12 px-4 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-y border-indigo-500/20">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full border border-yellow-500/30 uppercase tracking-wider">
                Limited Time
              </span>
              <h2 className="text-3xl font-bold font-display">
                Unlock Perplexity Pro <span className="text-yellow-300">For FREE</span>
              </h2>
              <p className="text-slate-300">Entrepreneurs & marketers who download Comet through 4ourMedia get exclusive Pro tier access — normally $20/month.</p>
              <ul className="space-y-2">
                {['Unlimited Copilot queries', 'Access to GPT-4o and Claude 3', 'Advanced Data Analysis', 'No credit card · No expiry'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-slate-300 text-sm justify-center md:justify-start">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0 bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center min-w-[200px]">
              <p className="text-slate-400 text-sm mb-1">Pro Plan</p>
              <p className="text-4xl font-bold text-slate-400 line-through">$20/mo</p>
              <p className="text-5xl font-bold text-green-400 mt-1">FREE</p>
              <p className="text-xs text-slate-500 mt-2">Via 4ourMedia partner link</p>
              <a
                href={AFFILIATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-100 transition-all"
              >
                Claim Pro Access <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Your Competitive{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Advantage</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Comet isn't just a browser. It's an intelligent analyst that lives in your toolbar.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-3 hover:border-indigo-500/40 transition-colors">
                <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg font-display">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-slate-900/60">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            Perplexity Comet vs The Alternatives
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800">
                  <th className="px-5 py-4 text-left text-slate-400 font-bold">Feature</th>
                  <th className="px-5 py-4 text-center text-indigo-300 font-bold">Perplexity Comet</th>
                  <th className="px-5 py-4 text-center text-slate-400 font-bold">ChatGPT</th>
                  <th className="px-5 py-4 text-center text-slate-400 font-bold">Google</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-800/30' : ''}>
                    <td className="px-5 py-3 text-slate-300">{row.feature}</td>
                    <td className="px-5 py-3 text-center"><Cell value={row.comet} /></td>
                    <td className="px-5 py-3 text-center"><Cell value={row.chatgpt} /></td>
                    <td className="px-5 py-3 text-center"><Cell value={row.google} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold font-display text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
                >
                  <span className="font-semibold text-slate-100">{faq.q}</span>
                  <span className="text-indigo-400 text-lg ml-4">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-t border-indigo-500/20 text-center">
        <div className="container mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold font-display">
            Ready to Supercharge Your Research?
          </h2>
          <p className="text-slate-400">
            Stop wasting hours on Google. Get Perplexity Comet free through 4ourMedia and unlock Pro features worth $20/month at zero cost.
          </p>
          <a
            href={AFFILIATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            ☄️ Download Comet Free Now
            <ExternalLink className="w-5 h-5" />
          </a>
          <p className="text-slate-500 text-sm">No signup • No credit card • Pro access included</p>
          <p className="text-slate-600 text-xs mt-4">
            Affiliate disclosure: 4ourMedia may earn a commission when you download Comet through our link, at no cost to you.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} 4ourMedia. Not officially affiliated with Perplexity AI.</p>
      </footer>
    </div>
  );
};

export default PerplexityPage;
