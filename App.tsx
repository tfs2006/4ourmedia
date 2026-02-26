import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppState, ProductAnalysis, LogoPosition, BrandKit as BrandKitType, HistoryItem, DailyCreditStatus, AspectRatio, ASPECT_RATIO_DIMENSIONS } from './types';
import { analyzeProductUrl, generatePromoBackground } from './services/geminiService';
import PromoCanvas from './components/PromoCanvas';
import LoadingStep from './components/LoadingStep';
import PurchaseModal from './components/PurchaseModalNew';
import LandingPage from './components/LandingPageNew';
import BrandKit, { getActiveBrandKit, setActiveBrandKit } from './components/BrandKit';
import HistoryPanel, { addToHistory } from './components/HistoryPanel';
import AuthModal from './components/AuthModal';
import { PrivacyPolicy, TermsOfService, RefundPolicy, ContactPage } from './components/LegalPages';
import FreeToolsPage from './components/FreeToolsPage';
import PerplexityPage from './components/PerplexityPage';
import { Download, Sparkles, AlertCircle, RefreshCw, Upload, Layout, Type, ArrowLeft, Zap, Star, Palette, Clock, Gift, User, LogOut, Target, ChevronDown, ChevronUp, PartyPopper, X, Lock, RectangleHorizontal } from 'lucide-react';
import { 
  AuthUser, 
  getCurrentUser, 
  onAuthStateChange, 
  signOut, 
  getUserCredits, 
  useCredit as useSupabaseCredit,
  claimDailyCredit as claimSupabaseDailyCredit,
  checkDailyCredit as checkSupabaseDailyCredit,
  savePromoToHistory as saveSupabaseHistory,
  addCredits
} from './services/supabase';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

type ViewState = 'landing' | 'app' | 'privacy' | 'terms' | 'refund' | 'contact' | 'free-tools' | 'perplexity';

// Daily credit helper functions (localStorage fallback for non-authenticated users)
function getDailyCreditStatus(): DailyCreditStatus {
  try {
    const stored = localStorage.getItem('promo_daily_credit');
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    lastClaimDate: '',
    dailyCreditAvailable: true,
    streakDays: 0,
    totalFreeCreditsEarned: 0
  };
}

function saveDailyCreditStatus(status: DailyCreditStatus) {
  localStorage.setItem('promo_daily_credit', JSON.stringify(status));
}

function checkDailyCredit(): { available: boolean; streakDays: number } {
  const status = getDailyCreditStatus();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (status.lastClaimDate === today) {
    return { available: false, streakDays: status.streakDays };
  }
  
  // Check if streak continues
  let newStreakDays = status.streakDays;
  if (status.lastClaimDate === yesterday) {
    newStreakDays = status.streakDays; // Will be incremented on claim
  } else if (status.lastClaimDate !== '') {
    newStreakDays = 0; // Streak broken
  }
  
  return { available: true, streakDays: newStreakDays };
}

function claimDailyCredit(): number {
  const status = getDailyCreditStatus();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Calculate streak
  let newStreakDays = 1;
  if (status.lastClaimDate === yesterday) {
    newStreakDays = status.streakDays + 1;
  }
  
  // Bonus credits for streaks!
  let bonusCredits = 0;
  if (newStreakDays === 7) bonusCredits = 2;  // 7-day streak = 2 bonus
  if (newStreakDays === 30) bonusCredits = 5; // 30-day streak = 5 bonus
  
  const totalCredits = 1 + bonusCredits;
  
  saveDailyCreditStatus({
    lastClaimDate: today,
    dailyCreditAvailable: false,
    streakDays: newStreakDays,
    totalFreeCreditsEarned: status.totalFreeCreditsEarned + totalCredits
  });
  
  return totalCredits;
}

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('landing');
  const [url, setUrl] = useState('');
  
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Credits & usage state
  const [creditsRemaining, setCreditsRemaining] = useState(3);
  const [maxCredits, setMaxCredits] = useState(3);
  const [sessionId, setSessionId] = useState<string>('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // Daily credit state
  const [dailyCreditAvailable, setDailyCreditAvailable] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [showDailyReward, setShowDailyReward] = useState(false);
  
  // Brand Kit & History
  const [showBrandKit, setShowBrandKit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeBrandKit, setActiveBrandKitState] = useState<BrandKitType | null>(null);
  
  // Customization State
  const [displayUrl, setDisplayUrl] = useState('4ourmedia.com');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-center');
  const [logoSize, setLogoSize] = useState<number>(30); // 30% width
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [purchaseCelebration, setPurchaseCelebration] = useState<{ credits: number; planId: string } | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  // Copy variation state: -1 = original, 0/1/2 = variation index
  const [activeCopyVariation, setActiveCopyVariation] = useState<number>(-1);
  
  // Computed analysis that reflects the selected copy variation
  const effectiveAnalysis = useMemo(() => {
    if (!analysis) return null;
    if (activeCopyVariation < 0 || !analysis.copyVariations?.length) return analysis;
    const variation = analysis.copyVariations[activeCopyVariation];
    if (!variation) return analysis;
    return {
      ...analysis,
      headline: variation.headline,
      subheadline: variation.subheadline,
    };
  }, [analysis, activeCopyVariation]);

  // Auto-dismiss purchase celebration toast after 6 seconds
  useEffect(() => {
    if (!purchaseCelebration) return;
    const timer = setTimeout(() => setPurchaseCelebration(null), 6000);
    return () => clearTimeout(timer);
  }, [purchaseCelebration]);

  // Check auth status on mount
  useEffect(() => {
    initializeAuth();
    loadBrandKitSettings();
    
    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(handleAuthChange);
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const initializeAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadUserCreditsFromSupabase(currentUser.id);
        await checkDailyCreditSupabase(currentUser.id);
        await checkPurchaseReturn(currentUser.id);
      } else {
        // Fallback to localStorage for non-authenticated users
        loadUserCredits();
        checkDailyCreditAvailability();
        await checkPurchaseReturn();
      }
    } catch (err) {
      console.error('Auth init error:', err);
      loadUserCredits();
    } finally {
      setIsLoadingAuth(false);
    }
  };
  
  const handleAuthChange = async (authUser: AuthUser | null) => {
    setUser(authUser);
    if (authUser) {
      await loadUserCreditsFromSupabase(authUser.id);
      await checkDailyCreditSupabase(authUser.id);
    }
  };
  
  const loadUserCreditsFromSupabase = async (userId: string) => {
    try {
      const credits = await getUserCredits(userId);
      setCreditsRemaining(credits.credits);
      setHasPurchased(credits.totalPurchased > 0);
      setStreakDays(credits.streakDays);
    } catch (err) {
      console.error('Error loading credits from Supabase:', err);
    }
  };
  
  const checkDailyCreditSupabase = async (userId: string) => {
    try {
      const { available, streakDays: streak } = await checkSupabaseDailyCredit(userId);
      setDailyCreditAvailable(available);
      setStreakDays(streak);
      if (available) {
        setShowDailyReward(true);
      }
    } catch (err) {
      console.error('Error checking daily credit:', err);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setCreditsRemaining(3);
    setHasPurchased(false);
    setStreakDays(0);
    setDailyCreditAvailable(false);
  };
  
  const handleAuthSuccess = async (authUser: AuthUser) => {
    setUser(authUser);
    await loadUserCreditsFromSupabase(authUser.id);
    await checkDailyCreditSupabase(authUser.id);
    setShowAuthModal(false);
    // After login, take user to the app view so they can start using it
    if (viewState === 'landing') {
      setViewState('app');
    }
  };
  
  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };
  
  const loadBrandKitSettings = () => {
    const kit = getActiveBrandKit();
    if (kit) {
      setActiveBrandKitState(kit);
      setDisplayUrl(kit.displayUrl || '4ourmedia.com');
      setCustomLogo(kit.logo);
      setLogoPosition(kit.logoPosition);
      setLogoSize(kit.logoSize);
    }
  };
  
  const checkDailyCreditAvailability = () => {
    // Fallback for non-authenticated users
    const { available, streakDays: streak } = checkDailyCredit();
    setDailyCreditAvailable(available);
    setStreakDays(streak);
    
    // Show reward popup if available
    if (available && localStorage.getItem('demo_session_id')) {
      setShowDailyReward(true);
    }
  };
  
  const handleClaimDailyCredit = async () => {
    if (user) {
      // Use Supabase
      const result = await claimSupabaseDailyCredit(user.id);
      if (result.success) {
        setCreditsRemaining(result.credits);
        setStreakDays(result.streakDays);
        setDailyCreditAvailable(false);
        setShowDailyReward(false);
      }
    } else {
      // Fallback to localStorage
      const creditsEarned = claimDailyCredit();
      setCreditsRemaining(prev => prev + creditsEarned);
      setDailyCreditAvailable(false);
      setStreakDays(prev => prev + 1);
      setShowDailyReward(false);
    }
  };
  
  const handleBrandKitSelect = (kit: BrandKitType) => {
    setActiveBrandKitState(kit);
    setDisplayUrl(kit.displayUrl || '4ourmedia.com');
    setCustomLogo(kit.logo);
    setLogoPosition(kit.logoPosition);
    setLogoSize(kit.logoSize);
  };
  
  const handleLoadFromHistory = (item: HistoryItem) => {
    setUrl(item.url);
    setAnalysis(item.analysis);
    setImageBase64(item.backgroundImage);
    setFinalImage(item.finalImage);
    setState(AppState.COMPLETE);
    setViewState('app');
  };

  const loadUserCredits = async () => {
    try {
      // Check for stored purchased credits
      const storedCredits = localStorage.getItem('promo_credits');
      const storedSessionId = localStorage.getItem('demo_session_id') || '';
      
      if (storedCredits) {
        const credits = JSON.parse(storedCredits);
        setCreditsRemaining(credits.remaining);
        setMaxCredits(credits.total);
        setHasPurchased(true);
      } else {
        // Get free demo status
        const response = await fetch(`${API_BASE}/api/demo/status`, {
          headers: { 'x-session-id': storedSessionId }
        });
        const data = await response.json();
        
        if (data.sessionId && !storedSessionId) {
          localStorage.setItem('demo_session_id', data.sessionId);
        }
        setSessionId(data.sessionId || storedSessionId);
        setCreditsRemaining(data.remaining);
        setMaxCredits(data.maxGenerations);
      }
    } catch {
      // Default to 3 free tries
      setCreditsRemaining(3);
      setMaxCredits(3);
    }
  };

  const checkPurchaseReturn = async (userId?: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    const purchaseStatus = urlParams.get('purchase');
    const stripeSessionId = urlParams.get('session_id');
    const planId = urlParams.get('plan');

    if (purchaseStatus === 'success' && stripeSessionId) {
      try {
        const response = await fetch(`${API_BASE}/api/purchase/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: stripeSessionId, userId })
        });
        
        if (response.ok) {
          const data = await response.json();
          // Store purchased credits locally
          const credits = {
            total: data.license.credits,
            remaining: data.license.credits,
            purchaseDate: new Date().toISOString()
          };
          localStorage.setItem('promo_credits', JSON.stringify(credits));
          setCreditsRemaining(credits.remaining);
          setMaxCredits(credits.total);
          setHasPurchased(true);
          
          // Show success celebration and go to app
          setPurchaseCelebration({ credits: data.license.credits, planId: data.license.planId });
          setViewState('app');
        }
      } catch (err) {
        console.error('Failed to verify purchase:', err);
      }
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Prevent double-click / concurrent generation
    if (state !== AppState.IDLE && state !== AppState.COMPLETE && state !== AppState.ERROR) return;
    
    // Require login before using demo
    if (!user) {
      openAuth('signup');
      return;
    }
    
    // Check credits
    if (creditsRemaining <= 0) {
      setShowPurchaseModal(true);
      return;
    }
    
    // Reset output but keep customization settings
    setError(null);
    setAnalysis(null);
    setImageBase64(null);
    setFinalImage(null);
    setActiveCopyVariation(-1);
    setState(AppState.ANALYZING);

    try {
      // 1. Analyze URL
      const result = await analyzeProductUrl(url);
      setAnalysis(result);
      
      // 2. Generate Image
      setState(AppState.GENERATING_IMAGE);
      const bgImage = await generatePromoBackground(result.imagePrompt);
      setImageBase64(bgImage);

      // 3. Trigger Canvas Composition
      setState(AppState.COMPOSITING);
      
      // 4. Decrement credits (using Supabase if authenticated)
      if (user) {
        const creditResult = await useSupabaseCredit(user.id);
        setCreditsRemaining(creditResult.remaining);
      } else {
        // Fallback to localStorage
        const newRemaining = creditsRemaining - 1;
        setCreditsRemaining(newRemaining);
        
        // Update stored credits
        if (hasPurchased) {
          const stored = JSON.parse(localStorage.getItem('promo_credits') || '{}');
          stored.remaining = newRemaining;
          localStorage.setItem('promo_credits', JSON.stringify(stored));
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Demo limit') || err.message?.includes('limit reached')) {
        setShowPurchaseModal(true);
      }
      setError(err.message || "Something went wrong. Please check the URL and try again.");
      setState(AppState.ERROR);
    }
  };

  // Listen for credit updates
  useEffect(() => {
    const handleDemoUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setCreditsRemaining(e.detail.remaining);
      }
    };
    
    window.addEventListener('demo-status-update', handleDemoUpdate as EventListener);
    return () => window.removeEventListener('demo-status-update', handleDemoUpdate as EventListener);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompositionComplete = useCallback(async (dataUrl: string) => {
    setFinalImage(dataUrl);
    if (state === AppState.COMPOSITING) {
      setState(AppState.COMPLETE);
      
      // Save to history (Supabase for authenticated users, localStorage for guests)
      if (analysis && imageBase64) {
        try {
          if (user) {
            console.log('Saving to Supabase history for user:', user.id);
            const savedId = await saveSupabaseHistory(user.id, url, analysis, imageBase64, dataUrl, activeBrandKit?.id);
            console.log('Supabase history save result:', savedId);
          } else {
            addToHistory(url, analysis, imageBase64, dataUrl, activeBrandKit?.id);
          }
        } catch (err) {
          console.error('Failed to save to history:', err);
        }
      }
    }
  }, [state, analysis, imageBase64, url, activeBrandKit, user]);

  const downloadImage = async () => {
    if (!finalImage) {
      console.error('No image to download');
      return;
    }
    
    const filename = `promo-${analysis?.productName.replace(/\s+/g, '-').toLowerCase() || 'image'}.png`;
    
    try {
      // Convert data URL to blob
      const response = await fetch(finalImage);
      const blob = await response.blob();
      
      // Check if Web Share API is available and can share files (iOS Safari, etc.)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: 'image/png' });
        const shareData = { files: [file] };
        
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            console.log('Shared successfully');
            return;
          } catch (shareErr: any) {
            // User cancelled or share failed, fall through to download
            if (shareErr.name !== 'AbortError') {
              console.log('Share failed, trying download:', shareErr);
            }
          }
        }
      }
      
      // Create blob URL for download
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = blobUrl;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      
      // Use timeout for mobile browser compatibility
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 150);
      }, 50);
      
      console.log('Download initiated:', filename);
    } catch (err) {
      console.error('Download failed:', err);
      // Final fallback: open image in new tab
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`<img src="${finalImage}" style="max-width:100%"/><p>Long-press to save image</p>`);
      }
    }
  };

  // Extra Pages
  if (viewState === 'free-tools') {
    return <FreeToolsPage onBack={() => setViewState('landing')} />;
  }
  if (viewState === 'perplexity') {
    return <PerplexityPage onBack={() => setViewState('landing')} />;
  }

  // Legal Pages
  if (viewState === 'privacy') {
    return <PrivacyPolicy onBack={() => setViewState('landing')} />;
  }
  if (viewState === 'terms') {
    return <TermsOfService onBack={() => setViewState('landing')} />;
  }
  if (viewState === 'refund') {
    return <RefundPolicy onBack={() => setViewState('landing')} />;
  }
  if (viewState === 'contact') {
    return <ContactPage onBack={() => setViewState('landing')} />;
  }

  // Show landing page
  if (viewState === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/30">
                4
              </div>
              <div>
                <h1 className="text-lg font-bold font-display tracking-wide">PromoGen</h1>
                <p className="text-xs text-slate-400">by 4ourMedia</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setViewState('free-tools')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🎬 Free Tools
              </button>
              <button
                onClick={() => setViewState('perplexity')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                ☄️ Perplexity AI
              </button>
              <button
                onClick={() => user ? setViewState('app') : openAuth('signup')}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium"
              >
                Try Free
              </button>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Get Credits
              </button>
            </div>
          </div>
        </header>
        
        <LandingPage 
          onGetStarted={() => user ? setViewState('app') : openAuth('signup')}
          onPurchase={(planId: string) => {
            setSelectedPlan(planId);
            setShowPurchaseModal(true);
          }}
          onNavigate={(page: string) => setViewState(page as ViewState)}
        />
        
        {/* Footer */}
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
                  AI-powered promo generator for marketers who want results, not headaches.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">Product</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><button onClick={() => user ? setViewState('app') : openAuth('signup')} className="hover:text-white transition-colors">Try Free</button></li>
                  <li><button onClick={() => setShowPurchaseModal(true)} className="hover:text-white transition-colors">Get Credits</button></li>
                  <li><button onClick={() => setViewState('free-tools')} className="hover:text-white transition-colors">🎬 Free YouTube Tools</button></li>
                  <li><button onClick={() => setViewState('perplexity')} className="hover:text-white transition-colors">☄️ Perplexity AI Free</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Support</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><button onClick={() => setViewState('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                  <li><a href="mailto:support@4ourmedia.com" className="hover:text-white transition-colors">support@4ourmedia.com</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">Legal</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><button onClick={() => setViewState('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
                  <li><button onClick={() => setViewState('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                  <li><button onClick={() => setViewState('refund')} className="hover:text-white transition-colors">Refund Policy</button></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">
                © {new Date().getFullYear()} 4ourMedia. All rights reserved.
              </p>
              <p className="text-slate-500 text-sm flex items-center gap-1">
                Powered by <span className="text-white font-medium">Google Gemini AI</span>
              </p>
            </div>
          </div>
        </footer>
        
        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
        
        {/* Purchase Modal */}
        <PurchaseModal 
          isOpen={showPurchaseModal} 
          onClose={() => setShowPurchaseModal(false)}
          creditsRemaining={creditsRemaining}
          selectedPlan={selectedPlan}
          userId={user?.id}
          userEmail={user?.email}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white flex flex-col">
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
      
      {/* Purchase Modal */}
      <PurchaseModal 
        isOpen={showPurchaseModal} 
        onClose={() => setShowPurchaseModal(false)}
        creditsRemaining={creditsRemaining}
        selectedPlan={selectedPlan}
        userId={user?.id}
        userEmail={user?.email}
      />
      
      {/* Brand Kit Modal */}
      {showBrandKit && (
        <BrandKit
          onSelect={handleBrandKitSelect}
          onClose={() => setShowBrandKit(false)}
          currentKit={activeBrandKit}
        />
      )}
      
      {/* History Panel */}
      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadPromo={handleLoadFromHistory}
        userId={user?.id}
      />
      
      {/* Daily Reward Popup */}
      {showDailyReward && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-8 max-w-sm w-full text-center border border-amber-500/50 shadow-2xl animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/50">
              <Gift className="w-10 h-10 text-amber-900" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Daily Reward!</h2>
            <p className="text-amber-200 mb-4">
              Welcome back! Claim your free daily credit.
              {streakDays > 0 && (
                <span className="block text-sm mt-1">
                  🔥 {streakDays} day streak! Keep it up!
                </span>
              )}
            </p>
            {streakDays === 6 && (
              <p className="text-yellow-300 text-sm mb-4 font-semibold">
                ✨ 1 more day for 2 BONUS credits!
              </p>
            )}
            <button
              onClick={handleClaimDailyCredit}
              className="w-full py-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-900 font-bold rounded-xl transition-all text-lg"
            >
              Claim +1 Credit
            </button>
            <button
              onClick={() => setShowDailyReward(false)}
              className="mt-3 text-amber-300 hover:text-white text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="p-3 md:p-6 border-b border-white/10 sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button
              onClick={() => setViewState('landing')}
              className="flex items-center gap-1 md:gap-2 text-slate-400 hover:text-white transition-colors p-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline text-sm">Back</span>
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center font-bold text-base md:text-lg">
                4
              </div>
              <h1 className="text-base md:text-lg font-bold font-display tracking-wide hidden sm:block">PromoGen</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Daily Reward Button */}
            {dailyCreditAvailable && (
              <button
                onClick={() => setShowDailyReward(true)}
                className="relative px-2 md:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-900 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <Gift className="w-4 h-4" />
                <span className="hidden md:inline">Daily Gift</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>
            )}
            
            {/* History Button */}
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="History"
            >
              <Clock className="w-5 h-5" />
            </button>
            
            {/* Brand Kit Button */}
            <button
              onClick={() => setShowBrandKit(true)}
              className={`p-2 rounded-lg transition-colors ${
                activeBrandKit 
                  ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' 
                  : 'hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Brand Kit"
            >
              <Palette className="w-5 h-5" />
            </button>
            
            <div className="h-6 w-px bg-slate-700 mx-0.5 md:mx-1 hidden sm:block"></div>
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-sm">
              <Zap className={`w-4 h-4 ${creditsRemaining > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-slate-300">
                {hasPurchased 
                  ? `${creditsRemaining} credits`
                  : `${creditsRemaining} free left`
                }
              </span>
            </div>
            
            {/* Mobile credits badge */}
            <div className="flex md:hidden items-center gap-1 px-2 py-1 bg-slate-800 rounded-full text-xs">
              <Zap className={`w-3 h-3 ${creditsRemaining > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className="text-slate-300">{creditsRemaining}</span>
            </div>
            
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-1"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{hasPurchased ? 'More Credits' : 'Get Credits'}</span>
            </button>
            
            {/* User Account */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg transition-colors">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => openAuth('signin')}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Sign In"
              >
                <User className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        
        {/* Intro / Form */}
        {state === AppState.IDLE && (
          <div className="max-w-2xl w-full space-y-6 animate-fade-in">
            {/* Credits Status Card */}
            {creditsRemaining <= 0 && (
              <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-2xl p-6 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      Out of Credits
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Purchase credits to keep creating amazing promos
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all"
                  >
                    Get Credits
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold font-display leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-indigo-300">
                Create Your Promo
              </h2>
              <p className="text-slate-400">
                Paste any product URL and watch the magic happen ✨
              </p>
            </div>
            
            <form onSubmit={handleGenerate} className="flex flex-col gap-6 bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Product URL</span>
                  <span className="text-xs font-normal normal-case text-slate-500">— Amazon, Shopify, any website</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://amazon.com/dp/B08..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none text-lg transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Branding Customization (Foldable) */}
              <div>
                 <button 
                  type="button" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mb-3 transition-colors"
                >
                  {showAdvanced ? '− Hide Branding Options' : '+ Customize Branding'}
                 </button>
                 
                 {showAdvanced && (
                   <div className="space-y-4 animate-fade-in">
                      {/* Aspect Ratio Selector */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5">
                          <RectangleHorizontal className="w-3.5 h-3.5" /> Image Size
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {(Object.keys(ASPECT_RATIO_DIMENSIONS) as AspectRatio[]).map((ratio) => {
                            const dim = ASPECT_RATIO_DIMENSIONS[ratio];
                            return (
                              <button
                                key={ratio}
                                type="button"
                                onClick={() => setAspectRatio(ratio)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                                  aspectRatio === ratio
                                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <div 
                                  className={`border-2 rounded-sm ${
                                    aspectRatio === ratio ? 'border-indigo-400' : 'border-slate-500'
                                  }`}
                                  style={{
                                    width: ratio === '16:9' ? 32 : ratio === '1:1' ? 22 : ratio === '4:5' ? 20 : 16,
                                    height: ratio === '16:9' ? 18 : ratio === '1:1' ? 22 : ratio === '4:5' ? 25 : 28,
                                  }}
                                />
                                <span className="text-[11px] font-bold">{ratio}</span>
                                <span className="text-[9px] opacity-70 leading-tight text-center">{dim.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase">Display URL</label>
                          <input 
                            type="text" 
                            value={displayUrl} 
                            onChange={(e) => setDisplayUrl(e.target.value)}
                            className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-sm focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase">Upload Logo</label>
                          <label className="flex items-center justify-center px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 hover:border-indigo-500 cursor-pointer transition-all group">
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            <div className="flex items-center gap-2 text-sm text-slate-400 group-hover:text-white">
                              <Upload className="w-4 h-4" />
                              {customLogo ? 'Logo Selected' : 'Choose File'}
                            </div>
                          </label>
                        </div>
                      </div>
                   </div>
                 )}
              </div>

              {/* Login required notice */}
              {!user && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-3">
                  <Lock className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-200 font-medium">Sign in to use free demo</p>
                    <p className="text-xs text-indigo-300/60 mt-0.5">Create a free account to get 3 demo generations</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuth('signup')}
                    className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold rounded-lg transition-all flex-shrink-0"
                  >
                    Sign Up Free
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={creditsRemaining <= 0 || !user}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {!user ? 'Sign In to Generate' : creditsRemaining <= 0 ? 'Get Credits to Continue' : 'Generate Promo'}
              </button>
              
              {/* Example URLs */}
              <div className="text-center text-xs text-slate-500">
                Try with: 
                <button 
                  type="button" 
                  onClick={() => setUrl('https://www.amazon.com/dp/B08N5WRWNW')}
                  className="text-indigo-400 hover:text-indigo-300 ml-1"
                >
                  Amazon Echo
                </button>
                {' • '}
                <button 
                  type="button" 
                  onClick={() => setUrl('https://www.amazon.com/dp/B09V3KXJPB')}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  AirPods Pro
                </button>
              </div>
            </form>
            
            {/* Features Reminder */}
            <div className="grid grid-cols-3 gap-4 text-center pt-4">
              {[
                { icon: Zap, label: '10 Seconds' },
                { icon: Star, label: 'AI Copy' },
                { icon: Download, label: 'Ready to Post' }
              ].map((item, i) => (
                <div key={i} className="text-slate-500 text-xs flex flex-col items-center gap-1">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {(state === AppState.ANALYZING || state === AppState.GENERATING_IMAGE || state === AppState.COMPOSITING) && (
          <LoadingStep currentStep={state} />
        )}

        {/* Error State */}
        {state === AppState.ERROR && (
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/50 rounded-xl p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-xl font-bold text-red-200">Generation Failed</h3>
            <p className="text-red-200/80">{error}</p>
            <button 
              onClick={() => setState(AppState.IDLE)}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success / Result State */}
        {(state === AppState.COMPLETE || (state === AppState.COMPOSITING && finalImage)) && finalImage && (
          <div className="flex flex-col lg:flex-row items-start gap-8 animate-fade-in w-full max-w-6xl">
            
            {/* Left: Preview */}
            <div className="flex-1 w-full flex justify-center bg-slate-800/30 p-6 md:p-8 rounded-2xl border border-slate-700/50 backdrop-blur-sm lg:sticky lg:top-24">
               <div className={`relative w-full shadow-2xl rounded-xl overflow-hidden ring-4 ring-slate-800 group ${
                 aspectRatio === '16:9' ? 'max-w-[480px] aspect-[16/9]' :
                 aspectRatio === '1:1' ? 'max-w-[380px] aspect-square' :
                 aspectRatio === '4:5' ? 'max-w-[340px] aspect-[4/5]' :
                 'max-w-[320px] md:max-w-[360px] aspect-[9/16]'
               }`}>
                  <img src={finalImage} alt="Generated Promo" className="w-full h-full object-cover" />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={downloadImage}
                      className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg flex items-center gap-2 transform scale-95 group-hover:scale-100 transition-transform"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                  </div>
               </div>
            </div>

            {/* Right: Actions & Details */}
            <div className="flex-1 w-full space-y-5">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-display text-white">Your Promo is Ready! 🎉</h3>
                  <p className="text-slate-400 text-sm mt-1">AI-generated in seconds</p>
                </div>
                <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  COMPLETE
                </span>
              </div>

              {/* AI-Generated Copy Preview */}
              {analysis && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI-Generated Copy</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Product Name</span>
                      <p className="font-bold text-lg md:text-xl leading-tight mt-0.5">{effectiveAnalysis?.productName}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Headline</span>
                        <p className="text-slate-200 font-medium mt-0.5 text-sm md:text-base">"{effectiveAnalysis?.headline}"</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">CTA</span>
                        <p className="text-slate-200 font-medium mt-0.5 text-sm md:text-base">{effectiveAnalysis?.callToAction || 'Get Yours Now'}</p>
                      </div>
                    </div>
                    
                    {effectiveAnalysis?.subheadline && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold">Subheadline</span>
                        <p className="text-slate-300 text-sm mt-0.5 italic">"{effectiveAnalysis.subheadline}"</p>
                      </div>
                    )}
                    
                    {effectiveAnalysis?.emotionalTrigger && (
                      <div className="pt-2 border-t border-slate-700">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Psychology Target</span>
                        <p className="text-slate-400 text-xs mt-0.5 capitalize">{effectiveAnalysis.emotionalTrigger.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Copy Variations Selector */}
                  {analysis?.copyVariations && analysis.copyVariations.length > 0 && (
                    <div className="pt-3 border-t border-slate-700 space-y-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Copy Variations — click to apply</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => setActiveCopyVariation(-1)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeCopyVariation === -1
                              ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          Original
                        </button>
                        {analysis.copyVariations.map((variation, index) => (
                          <button
                            key={index}
                            onClick={() => setActiveCopyVariation(index)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                              activeCopyVariation === index
                                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {variation.style}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Audience Insights Panel */}
              {analysis?.audienceProfile && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-pink-400" />
                      <h4 className="font-bold text-sm text-slate-200">Audience Insights</h4>
                      <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">AI</span>
                    </div>
                    {showInsights ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showInsights && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Demographics & Psychographics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Demographics</p>
                          <p className="text-xs text-slate-300">{analysis.audienceProfile.demographics}</p>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Psychographics</p>
                          <p className="text-xs text-slate-300">{analysis.audienceProfile.psychographics}</p>
                        </div>
                      </div>

                      {/* Pain Points & Desires */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-red-400/80 mb-2">Pain Points</p>
                          <ul className="space-y-1">
                            {analysis.audienceProfile.painPoints?.map((point: string, i: number) => (
                              <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                <span className="text-red-400 mt-0.5">•</span> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-green-400/80 mb-2">Desires</p>
                          <ul className="space-y-1">
                            {analysis.audienceProfile.desires?.map((desire: string, i: number) => (
                              <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                <span className="text-green-400 mt-0.5">•</span> {desire}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Buying Triggers */}
                      {analysis.audienceProfile.buyingTriggers?.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-amber-400/80 mb-2">Buying Triggers</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.audienceProfile.buyingTriggers.map((trigger: string, i: number) => (
                              <span key={i} className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded-full">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Competitor Weaknesses */}
                      {analysis.audienceProfile.competitorWeaknesses && (
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-[10px] uppercase tracking-wider text-purple-400/80 mb-1">Competitor Weaknesses</p>
                          <p className="text-xs text-slate-400">{analysis.audienceProfile.competitorWeaknesses}</p>
                        </div>
                      )}

                      {/* Best Platforms & Tone */}
                      <div className="grid grid-cols-2 gap-3">
                        {analysis.audienceProfile.bestPlatforms?.length > 0 && (
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-[10px] uppercase tracking-wider text-blue-400/80 mb-2">Best Platforms</p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.audienceProfile.bestPlatforms.map((platform: string, i: number) => (
                                <span key={i} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded-full">
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {analysis.audienceProfile.toneOfVoice && (
                          <div className="bg-slate-900/50 rounded-lg p-3">
                            <p className="text-[10px] uppercase tracking-wider text-indigo-400/80 mb-1">Recommended Tone</p>
                            <p className="text-xs text-slate-300 italic">"{analysis.audienceProfile.toneOfVoice}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Customization Panel */}
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                   <Layout className="w-4 h-4 text-indigo-400" />
                   <h4 className="font-bold text-sm text-slate-200">Customize Design</h4>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <RectangleHorizontal className="w-3 h-3" /> Image Size
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(ASPECT_RATIO_DIMENSIONS) as AspectRatio[]).map((ratio) => {
                      const dim = ASPECT_RATIO_DIMENSIONS[ratio];
                      return (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                            aspectRatio === ratio
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div 
                            className={`border-2 rounded-sm ${
                              aspectRatio === ratio ? 'border-indigo-400' : 'border-slate-500'
                            }`}
                            style={{
                              width: ratio === '16:9' ? 28 : ratio === '1:1' ? 18 : ratio === '4:5' ? 16 : 12,
                              height: ratio === '16:9' ? 16 : ratio === '1:1' ? 18 : ratio === '4:5' ? 20 : 22,
                            }}
                          />
                          <span className="text-[10px] font-bold">{ratio}</span>
                          <span className="text-[8px] opacity-60 leading-tight text-center">{dim.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* URL Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <Type className="w-3 h-3" /> Display URL
                  </label>
                  <input 
                    type="text" 
                    value={displayUrl} 
                    onChange={(e) => setDisplayUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Logo Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400">Logo</label>
                    <label className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      {customLogo ? 'Change Logo' : 'Upload Logo'}
                    </label>
                  </div>

                  {customLogo && (
                    <div className="space-y-4 animate-fade-in">
                      {/* Position Grid */}
                      <div className="space-y-2">
                         <span className="text-[10px] uppercase text-slate-500 font-bold">Position</span>
                         <div className="grid grid-cols-3 gap-2 w-max">
                           {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as LogoPosition[]).map(pos => (
                             <button
                               key={pos}
                               onClick={() => setLogoPosition(pos)}
                               className={`w-10 h-10 rounded border flex items-center justify-center transition-all ${
                                 logoPosition === pos 
                                 ? 'bg-indigo-600 border-indigo-400 text-white' 
                                 : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                               }`}
                             >
                               <div className={`w-2 h-2 bg-current rounded-sm ${
                                 pos.includes('top') ? 'mb-4' : 'mt-4'
                               } ${
                                 pos.includes('left') ? 'mr-4' : pos.includes('right') ? 'ml-4' : ''
                               }`} />
                             </button>
                           ))}
                         </div>
                      </div>

                      {/* Size Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase text-slate-500 font-bold">
                           <span>Size</span>
                           <span>{logoSize}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="80" 
                          value={logoSize} 
                          onChange={(e) => setLogoSize(Number(e.target.value))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                  {!customLogo && (
                    <div className="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded border border-slate-700/50">
                      Upload a logo to enable positioning controls.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={downloadImage}
                  className="flex-1 px-6 py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download Image</span>
                  <span className="sm:hidden">Save to Photos</span>
                </button>
                <button
                  onClick={() => setState(AppState.IDLE)}
                  className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 touch-manipulation"
                >
                  <RefreshCw className="w-5 h-5" />
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvas Logic */}
        {imageBase64 && effectiveAnalysis && (
          <PromoCanvas 
            imageBase64={imageBase64} 
            analysis={effectiveAnalysis}
            customLogo={customLogo}
            logoPosition={logoPosition}
            logoSize={logoSize}
            displayUrl={displayUrl}
            aspectRatio={aspectRatio}
            onCompositionComplete={handleCompositionComplete} 
          />
        )}

      </main>

      {/* Purchase Success Celebration Toast */}
      {purchaseCelebration && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pointer-events-none">
          <div 
            className="pointer-events-auto bg-gradient-to-br from-emerald-500/95 to-teal-600/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-emerald-500/20 border border-emerald-400/30 max-w-sm w-full mx-4 animate-bounce-in"
            style={{ animation: 'toast-slide-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            <button
              onClick={() => setPurchaseCelebration(null)}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-xl p-3 flex-shrink-0">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Purchase Successful!</h3>
                <p className="text-emerald-100 text-sm mt-1">
                  <span className="font-bold text-white text-lg">{purchaseCelebration.credits}</span> credits have been added to your account.
                </p>
                <p className="text-emerald-200/70 text-xs mt-2">Start creating amazing promos now ✨</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toast-slide-in {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Footer */}
      <footer className="p-6 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} 4ourMedia. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
}
