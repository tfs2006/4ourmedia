import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2, Download, Copy, ExternalLink, Sparkles, Shield, Zap, Star, Gift } from 'lucide-react';
import { CelebrationIcon } from './Icons';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  demoRemaining?: number;
}

declare const __DEV__: boolean;
const API_BASE = (typeof window !== 'undefined' && window.location.port === '3000') ? 'http://localhost:3001' : '';

async function parseApiResponse(response: Response) {
  const raw = await response.text();

  try {
    return JSON.parse(raw) as { url?: string; error?: string };
  } catch {
    if (!response.ok) {
      return { error: raw || 'Failed to create checkout' };
    }

    throw new Error('Received an invalid response from checkout');
  }
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, demoRemaining }) => {
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [license, setLicense] = useState<{ key: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/purchase/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: `${window.location.origin}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.origin
        })
      });

      const data = await parseApiResponse(response);

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const copyLicenseKey = () => {
    if (license?.key) {
      navigator.clipboard.writeText(license.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-md w-full overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
              {purchased ? <Check className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
            </div>
            <h2 className="text-2xl font-bold">
              {purchased ? <><CelebrationIcon size={18} className="inline-block mr-2 text-yellow-300" /> Purchase Complete!</> : 'Unlock Unlimited Promos'}
            </h2>
            {!purchased && (
              <p className="text-white/80 text-sm mt-2">One payment. Lifetime access. No subscriptions.</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {!purchased ? (
            <>
              {/* Urgency/Scarcity Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
                <Gift className="w-8 h-8 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 font-bold text-sm">Launch Special — 75% OFF</p>
                  <p className="text-amber-200/70 text-xs">Limited time offer. Regular price $199</p>
                </div>
              </div>

              {/* Demo limit warning */}
              {demoRemaining !== undefined && demoRemaining <= 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold">Demo limit reached!</p>
                    <p className="text-red-200/70 text-xs mt-0.5">Upgrade now to continue creating promos.</p>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Everything You Get:
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { text: 'Unlimited promo generations', highlight: true },
                    { text: 'AI-powered psychology copywriting', highlight: true },
                    { text: 'Full source code (React + Node.js)', highlight: false },
                    { text: 'Use your own Gemini API key', highlight: false },
                    { text: 'Commercial license included', highlight: false },
                    { text: 'Lifetime updates & support', highlight: false }
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.highlight ? 'bg-green-500/20' : 'bg-slate-700'
                      }`}>
                        <Check className={`w-3 h-3 ${feature.highlight ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <span className={feature.highlight ? 'font-medium' : ''}>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price */}
              <div className="text-center py-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-slate-500 line-through text-lg">$199</span>
                  <span className="text-5xl font-bold text-white">$49</span>
                </div>
                <span className="text-slate-400 text-sm">one-time payment</span>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-600/30 hover:shadow-green-600/50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Get Lifetime Access — $49
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-slate-400 hover:text-white font-medium transition-all"
                >
                  Maybe Later
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 pt-2 text-slate-500 text-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secure Checkout
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Instant Access
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  30-Day Guarantee
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-slate-300">
                  Thank you for your purchase! Here's your license key:
                </p>
              </div>

              {/* License Key */}
              {license && (
                <div className="space-y-3">
                  <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-between">
                    <code className="text-indigo-300 font-mono text-sm">{license.key}</code>
                    <button
                      onClick={copyLicenseKey}
                      className="p-2 hover:bg-slate-700 rounded transition-colors"
                      title="Copy license key"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 text-center">
                    License registered to: {license.email}
                  </p>
                </div>
              )}

              {/* Download Button */}
              <a
                href={`${API_BASE}/api/download/${license?.key}`}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PromoGen
              </a>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                Continue to App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
