import React from 'react';

interface LandingFooterProps {
  onOpenPromoGen: () => void;
  onPurchase: () => void;
  onNavigate: (view: 'veo-studio' | 'title-scorer' | 'free-tools' | 'perplexity' | 'contact' | 'privacy' | 'terms' | 'refund') => void;
}

export default function LandingFooter({ onOpenPromoGen, onPurchase, onNavigate }: LandingFooterProps) {
  return (
    <footer className="py-12 px-4 border-t border-slate-800">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-bold">
                4
              </div>
              <span className="font-bold font-display">PromoGen</span>
            </div>
            <p className="text-slate-400 text-sm">
              Creator research and AI production tools for teams that want better campaigns with less guesswork.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={onOpenPromoGen} className="hover:text-white transition-colors">Open PromoGen</button></li>
              <li><button onClick={onPurchase} className="hover:text-white transition-colors">PromoGen Credits</button></li>
              <li><button onClick={() => onNavigate('veo-studio')} className="hover:text-white transition-colors">🎥 Veo Studio</button></li>
              <li><button onClick={() => onNavigate('title-scorer')} className="hover:text-white transition-colors">📝 Title Scorer</button></li>
              <li><button onClick={() => onNavigate('free-tools')} className="hover:text-white transition-colors">🎬 Promofinder Suite</button></li>
              <li><button onClick={() => onNavigate('perplexity')} className="hover:text-white transition-colors">☄️ Perplexity AI Free</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
              <li><a href="mailto:support@4ourmedia.com" className="hover:text-white transition-colors">support@4ourmedia.com</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigate('refund')} className="hover:text-white transition-colors">Refund Policy</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} 4ourMedia. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm flex items-center gap-1">
            Powered by <span className="text-white font-medium">Google Gemini AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
