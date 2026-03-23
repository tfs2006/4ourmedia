import React, { useState } from 'react';
import { Check, Loader2, X, Sparkles, Zap, Star, Crown, Package } from 'lucide-react';
import { ACTIVE_PRICING_PLANS, ACTIVE_PLAN_IDS, formatPricePerCredit, FEATURE_PRICING } from '../lib/pricing';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditsRemaining?: number;
  selectedPlan?: string;
  userId?: string;
  userEmail?: string;
}

const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:3001' : '';

// Plan Type
interface Plan {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  pricePerCredit?: string;
  savings?: string;
  interval?: string;
  popular?: boolean;
  bestValue?: boolean;
  icon: React.FC<{ className?: string }>;
  color: string;
  features: string[];
}

const PLAN_ICONS: Record<string, React.FC<{ className?: string }>> = {
  starter: Package,
  pro: Star,
  agency: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'from-slate-600 to-slate-700',
  pro: 'from-indigo-600 to-purple-600',
  agency: 'from-amber-500 to-orange-500',
};

const PLANS: Record<string, Plan> = Object.fromEntries(
  ACTIVE_PLAN_IDS.map((planId) => {
    const plan = ACTIVE_PRICING_PLANS[planId];
    return [
      planId,
      {
        id: plan.id,
        name: plan.name.replace(' Pack', ''),
        credits: plan.credits,
        price: plan.priceInCents / 100,
        originalPrice: plan.originalPriceInCents ? plan.originalPriceInCents / 100 : undefined,
        pricePerCredit: formatPricePerCredit(plan.id),
        savings: plan.savings,
        popular: !!plan.popular,
        bestValue: plan.badge === 'BEST VALUE',
        icon: PLAN_ICONS[plan.id],
        color: PLAN_COLORS[plan.id],
        features: plan.features,
      },
    ];
  })
) as Record<string, Plan>;

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, creditsRemaining = 0, selectedPlan = 'pro', userId, userEmail }) => {
  const [currentPlan, setCurrentPlan] = useState(selectedPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS[currentPlan as keyof typeof PLANS] || PLANS.pro;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/purchase/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: currentPlan,
          userId: userId || '',
          userEmail: userEmail || '',
          successUrl: `${window.location.origin}?purchase=success&plan=${currentPlan}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.origin
        })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto animate-fade-in">
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-lg w-full overflow-hidden shadow-2xl relative">
        
          {/* Header */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 pt-8 text-center">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          
          <div className="w-16 h-16 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Get More Credits</h2>
          <p className="text-white/80 text-sm mt-2">Credits never expire. Use them whenever you need.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Out of credits warning */}
          {creditsRemaining <= 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200 text-sm flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">You've used all your free generations!</p>
                <p className="text-amber-200/70 text-xs mt-0.5">Purchase credits to keep creating amazing promos.</p>
              </div>
            </div>
          )}

          {/* Plan Selector */}
          <div className="space-y-3">
            {Object.values(PLANS).map((p) => {
              const Icon = p.icon;
              const isSelected = currentPlan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setCurrentPlan(p.id)}
                  className={`relative w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-500/10' 
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                      POPULAR
                    </span>
                  )}
                  {p.bestValue && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
                      BEST VALUE
                    </span>
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-sm text-slate-400">{p.credits} credits</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold">${p.price}</p>
                    {p.pricePerCredit && (
                      <p className="text-xs text-slate-400">{p.pricePerCredit}/credit</p>
                    )}
                  </div>
                  
                  {isSelected && (
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Plan Features */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm font-bold mb-2 text-slate-300">What you get:</p>
            <ul className="space-y-1.5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Standard promo generations use {FEATURE_PRICING['promo-generation'].creditsRequired} credit. Veo video renders use {FEATURE_PRICING['veo-video'].creditsRequired} credits.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Buy Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Get {plan.credits} Credits — ${plan.price}
              </>
            )}
          </button>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-400" />
              Secure checkout
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-400" />
              Instant delivery
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-400" />
              No subscription
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
