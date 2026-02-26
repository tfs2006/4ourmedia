import React from 'react';
import {
  ArrowLeft, ExternalLink, Search, EyeOff, TrendingUp,
  Network, GitCompare, DollarSign, Flame, Gauge,
  Globe, CheckCircle
} from 'lucide-react';

interface FreeToolsPageProps {
  onBack: () => void;
}

const tools = [
  {
    icon: Search,
    label: 'Most Popular',
    labelColor: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
    name: 'YouTube Promo Finder',
    tagline: 'Uncover every sponsorship hiding in any channel',
    description:
      'Paste any channel URL and instantly reveal every sponsorship, affiliate link, and brand deal hidden inside 12 months of video descriptions. See exactly who pays your competitors — and who should be paying you.',
    bullets: [
      'Analyzes up to 12 months of content',
      'Detects affiliate links, tracking codes & brand mentions',
      'Export results to CSV or JSON',
    ],
    url: 'https://promofinder.4ourmedia.com',
    cta: 'Launch Tool',
    featured: true,
  },
  {
    icon: Globe,
    label: null,
    name: 'Domain Search',
    tagline: 'Find every creator promoting any brand',
    description:
      "Enter any brand's domain — like gfuel.com or squarespace.com — and instantly surface every YouTube creator promoting it. The fastest way to map a competitor's entire influencer roster.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/domain',
    cta: 'Try Domain Search',
  },
  {
    icon: EyeOff,
    label: null,
    name: 'Unlisted Video Finder',
    tagline: 'Discover hidden content creators forget about',
    description:
      "Find unlisted YouTube videos that don't appear in regular uploads. Surfaces hidden gems buried in public playlists — bonus content, early releases, and behind-the-scenes clips creators thought flew under the radar.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/unlisted',
    cta: 'Find Unlisted Videos',
  },
  {
    icon: TrendingUp,
    label: null,
    name: 'Channel Growth Tracker',
    tagline: "Know who's rising before your competitor does",
    description:
      "Analyze any channel's upload frequency, posting schedule, and subscriber momentum over time. Lock in the right creator partnership at exactly the right moment in their growth curve.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/growth',
    cta: 'Analyze Growth',
  },
  {
    icon: Network,
    label: null,
    name: 'Collaboration Finder',
    tagline: 'Map the hidden creator network',
    description:
      "Scan video descriptions to surface every channel mention and cross-promotion — revealing who collaborates with whom and which creator communities overlap with your target audience.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/collab',
    cta: 'Explore Collabs',
  },
  {
    icon: GitCompare,
    label: null,
    name: 'Compare Sponsors',
    tagline: 'Side-by-side sponsorship intelligence',
    description:
      "Drop in two channels and get an instant breakdown of shared sponsors, exclusive deals, and sponsorship overlap. Perfect for benchmarking partnerships against a rival creator or vetting influencer fit.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/compare',
    cta: 'Compare Channels',
  },
  {
    icon: DollarSign,
    label: null,
    name: 'Sponsorship Rate Estimator',
    tagline: 'The data agencies charge $1,000+ for — free',
    description:
      "Stop guessing what to charge — or what to pay. Estimated sponsorship rates for any YouTube channel based on views, engagement, and niche. No agency. No invoice. Just data.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/rate',
    cta: 'Estimate Rates',
  },
  {
    icon: Flame,
    label: null,
    name: 'Viral Video Detector',
    tagline: 'Find the content that actually broke through',
    description:
      "Scans up to 200 uploads to surface outlier content that got 3–10x a channel's normal views. Decode the patterns behind viral success before you plan your next campaign.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/viral',
    cta: 'Detect Viral Hits',
  },
  {
    icon: Gauge,
    label: null,
    name: 'Sponsor Saturation Score',
    tagline: 'Essential due diligence before any brand deal',
    description:
      "Is this creator oversold? Measure how frequently a channel promotes brands over 12 months to detect audience fatigue risk before you commit budget. Essential sanity check for every brand deal.",
    bullets: [],
    url: 'https://promofinder.4ourmedia.com/saturation',
    cta: 'Check Saturation',
  },
];

const FreeToolsPage: React.FC<FreeToolsPageProps> = ({ onBack }) => {
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/30">
              4
            </div>
            <span className="font-bold text-sm hidden sm:inline font-display">4ourMedia Free Tools</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="relative container mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 text-green-300 text-sm font-medium mb-6">
            🎬 100% Free · No Login Required · No Paywall
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-200">
              The Free YouTube
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Intelligence Suite
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Nine powerful tools built by 4ourMedia partner{' '}
            <a
              href="https://promofinder.4ourmedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              PromoFinder
            </a>{' '}
            that give brands, creators, and marketers the sponsorship data agencies charge thousands for.
            No account. No paywall. No tricks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-400">
            {['9 Free Tools', 'No Signup', 'Export to CSV/JSON', 'Real-Time Data'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl space-y-6">

          {/* Featured card */}
          {tools.filter(t => t.featured).map((tool) => (
            <div
              key={tool.name}
              className="relative bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5" />
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
                <tool.icon className="w-8 h-8 text-indigo-400" />
              </div>
              {/* Content */}
              <div className="flex-1 space-y-3 relative">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold font-display">{tool.name}</h2>
                  {tool.label && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${tool.labelColor}`}>
                      {tool.label}
                    </span>
                  )}
                </div>
                <p className="text-indigo-300 font-medium">{tool.tagline}</p>
                <p className="text-slate-300 leading-relaxed">{tool.description}</p>
                {tool.bullets.length > 0 && (
                  <ul className="flex flex-col gap-2 mt-2">
                    {tool.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* CTA */}
              <div className="flex-shrink-0 relative">
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap"
                >
                  {tool.cta}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}

          {/* Regular grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.filter(t => !t.featured).map((tool) => (
              <div
                key={tool.name}
                className="bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 group"
              >
                <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                  <tool.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-lg font-display">{tool.name}</h3>
                  <p className="text-indigo-400 text-sm font-medium">{tool.tagline}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                </div>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-white border border-slate-700 hover:border-indigo-500 px-4 py-2 rounded-lg transition-all w-fit"
                >
                  {tool.cta}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold font-display mb-4">
            All Nine Tools.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Always Free.
            </span>
          </h2>
          <p className="text-slate-400 mb-8">
            No login. No credit card. No premium tier. Just the data you need to make smarter sponsorship decisions.
          </p>
          <a
            href="https://promofinder.4ourmedia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            🎬 Explore the Full Suite
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>
          © {new Date().getFullYear()} 4ourMedia. Free YouTube intelligence tools powered by{' '}
          <a href="https://promofinder.4ourmedia.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-white">
            PromoFinder
          </a>.
        </p>
      </footer>
    </div>
  );
};

export default FreeToolsPage;
