import React from 'react';
import { Sparkles, ShoppingCart } from 'lucide-react';

interface DemoBannerProps {
  remaining: number;
  maxGenerations: number;
  onPurchase: () => void;
}

const DemoBanner: React.FC<DemoBannerProps> = ({ remaining, maxGenerations, onPurchase }) => {
  const usedCount = maxGenerations - remaining;
  const percentUsed = (usedCount / maxGenerations) * 100;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-amber-200">Demo Mode</p>
            <p className="text-sm text-amber-200/70">
              {remaining > 0 
                ? `${remaining} of ${maxGenerations} free generations remaining`
                : 'You\'ve used all free generations'}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex-1 min-w-[150px] max-w-[200px] hidden sm:block">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                remaining === 0 ? 'bg-red-500' : remaining === 1 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${100 - percentUsed}%` }}
            />
          </div>
        </div>

        <button
          onClick={onPurchase}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-sm shadow-lg shadow-amber-500/20"
        >
          <ShoppingCart className="w-4 h-4" />
          Buy Full Version
        </button>
      </div>
    </div>
  );
};

export default DemoBanner;
