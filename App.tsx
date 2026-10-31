import React, { lazy, Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, ProductAnalysis, LogoPosition, BrandKit as BrandKitType, HistoryItem, DailyCreditStatus, AspectRatio, ASPECT_RATIO_DIMENSIONS, PromoConversionPreset, SocialPlatform } from './types';
import { generatePromoAsset } from './services/geminiService';
import LandingPage from './components/LandingPageNew';
import MobileLandingNav from './components/MobileLandingNav';
import LandingFooter from './components/LandingFooter';
import ToolViews from './components/ToolViews';
import BrandKit, { getActiveBrandKit, setActiveBrandKit } from './components/BrandKit';
import HistoryPanel, { addToHistory } from './components/HistoryPanel';
import { FEATURE_PRICING } from './lib/pricing';
import { clearAdminSession, hasAdminSessionAccess } from './lib/adminSession';
import { Download, Sparkles, AlertCircle, RefreshCw, Upload, Layout, Type, ArrowLeft, Zap, Star, Palette, Clock, Gift, User, LogOut, Target, TrendingUp, ChevronDown, ChevronUp, PartyPopper, X, Lock, RectangleHorizontal, Copy, CheckCheck, Hash, MessageSquare, Film, Mail, Shield } from 'lucide-react';
import { FlameIcon, SparklesIcon } from './components/Icons';
import {
  AuthUser, 
  cleanupAuthRedirectUrl,
  finalizeAuthRedirect,
  getCurrentUser, 
  getSession,
  onAuthStateChange, 
  signOut, 
  getUserCredits, 
  useCredit as useSupabaseCredit,
  claimDailyCredit as claimSupabaseDailyCredit,
  checkDailyCredit as checkSupabaseDailyCredit,
  savePromoToHistory as saveSupabaseHistory,
  addCredits
} from './services/supabase';
import {
  API_BASE, PROMOFINDER_ORIGIN, PATH_TO_VIEW_STATE, VIEW_STATE_TO_PATH, CONVERSION_PRESETS,
  ViewState, PageLoader, ModalLoader, AdminDashboardPage, PromoCanvas, LoadingStep,
  PurchaseModal, AuthModal, FreeToolsPage, PerplexityPage, VeoStudioPage, TitleScorerPage,
  UploadAuditorPage, TitleTrackerPage, HookLibraryPage, ThumbnailCheckerPage, ScriptBuilderPage, MuseCoursePage,
  PrivacyPolicy, TermsOfService, RefundPolicy, ContactPage,
  getDailyCreditStatus, saveDailyCreditStatus, checkDailyCredit, claimDailyCredit,
} from './lib/appShared';

export default function App() {
  const loadingTimerIds = useRef<number[]>([]);
  const [viewState, setViewState] = useState<ViewState>('landing');
  const [previousViewState, setPreviousViewState] = useState<ViewState>('landing');
  const [isAdminSessionActive, setIsAdminSessionActive] = useState(() => hasAdminSessionAccess());
  const [url, setUrl] = useState('');
  
  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  
  // Credits & usage state
  const [creditsRemaining, setCreditsRemaining] = useState(3);
  const [maxCredits, setMaxCredits] = useState(3);
  const [sessionId, setSessionId] = useState<string>('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [showBotPurchaseModal, setShowBotPurchaseModal] = useState(false);
  const [selectedBotPlan, setSelectedBotPlan] = useState<string>('bot-pro');
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
  
  // Platform & social content state
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [conversionPreset, setConversionPreset] = useState<PromoConversionPreset>('auto');
  const [contentKitTab, setContentKitTab] = useState<'caption' | 'hashtags' | 'hook' | 'email'>('caption');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [purchaseCelebration, setPurchaseCelebration] = useState<{ credits: number; planId: string } | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  // Copy variation state: -1 = original, 0/1/2 = variation index
  const [activeCopyVariation, setActiveCopyVariation] = useState<number>(-1);

  const launchPromofinder = useCallback(async (targetUrl: string, newTab = true) => {
    try {
      const resolved = new URL(targetUrl, window.location.origin);
      if (resolved.origin === PROMOFINDER_ORIGIN && user) {
        const session = await getSession();
        const accessToken = session?.access_token;
        if (accessToken) {
          const hashParams = new URLSearchParams(resolved.hash.startsWith('#') ? resolved.hash.slice(1) : resolved.hash);
          hashParams.set('accountToken', accessToken);
          resolved.hash = hashParams.toString();
        }
      }

      if (newTab) {
        window.open(resolved.toString(), '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(resolved.toString());
      }
    } catch {
      if (newTab) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.assign(targetUrl);
      }
    }
  }, [user]);
  
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

  const syncViewFromLocation = useCallback(() => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname === '/auth/callback') {
      return;
    }

    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'admin') {
      setViewState('admin');
      return;
    }
    if (hash === 'app') {
      setViewState('app');
      return;
    }

    const mapped = PATH_TO_VIEW_STATE[pathname];
    if (mapped) {
      setViewState(mapped);
    }
  }, []);

  useEffect(() => {
    syncViewFromLocation();
    window.addEventListener('popstate', syncViewFromLocation);
    window.addEventListener('hashchange', syncViewFromLocation);
    return () => {
      window.removeEventListener('popstate', syncViewFromLocation);
      window.removeEventListener('hashchange', syncViewFromLocation);
    };
  }, [syncViewFromLocation]);

  useEffect(() => {
    if (window.location.pathname.toLowerCase() === '/auth/callback') {
      return;
    }

    const targetPath = VIEW_STATE_TO_PATH[viewState];
    if (!targetPath) {
      return;
    }

    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const shouldClearHash = currentHash === '#admin' || currentHash === '#app';

    if (currentPath !== targetPath || shouldClearHash) {
      window.history.pushState({}, '', targetPath);
    }
  }, [viewState]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!showUserMenu) return;
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const clearLoadingTimers = useCallback(() => {
    for (const timerId of loadingTimerIds.current) {
      window.clearTimeout(timerId);
    }
    loadingTimerIds.current = [];
  }, []);

  const scheduleLoadingProgress = useCallback(() => {
    clearLoadingTimers();
    loadingTimerIds.current = [
      window.setTimeout(() => {
        setState((current) => current === AppState.ANALYZING ? AppState.GENERATING_IMAGE : current);
      }, 5000),
      window.setTimeout(() => {
        setState((current) => (
          current === AppState.ANALYZING || current === AppState.GENERATING_IMAGE
            ? AppState.COMPOSITING
            : current
        ));
      }, 12000),
    ];
  }, [clearLoadingTimers]);

  useEffect(() => clearLoadingTimers, [clearLoadingTimers]);
  
  const initializeAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await finalizeAuthRedirect();
      if (currentUser) {
        setUser(currentUser);
        await loadUserCreditsFromSupabase(currentUser.id);
        await checkDailyCreditSupabase(currentUser.id);
        await checkPurchaseReturn(currentUser.id);
        cleanupAuthRedirectUrl();
        setViewState('app');
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
    clearAdminSession();
    setIsAdminSessionActive(false);
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

  const openAdminDashboard = () => {
    if (!user) {
      openAuth('signin');
      return;
    }

    setPreviousViewState(viewState === 'admin' ? 'landing' : viewState);
    setViewState('admin');
  };

  const closeAdminDashboard = () => {
    setViewState(previousViewState === 'admin' ? 'landing' : previousViewState);
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
  
  const handleLoadFromHistory = (_item: HistoryItem) => {
    // The old promo generator is retired; history entries no longer load
    // into a canvas. Keep the panel closable without side effects.
    setShowHistory(false);
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
    const botPurchaseStatus = urlParams.get('botPurchase');
    const botSessionId = urlParams.get('bot_session_id');
    const botPlan = urlParams.get('botPlan');

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

    if (botPurchaseStatus === 'success' && botSessionId) {
      try {
        const response = await fetch(`${API_BASE}/api/purchase/bot-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: botSessionId, planId: botPlan }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.downloadUrl) {
            const email = user?.email ? `&email=${encodeURIComponent(user.email)}` : '';
            const downloadResponse = await fetch(`${data.downloadUrl}${email}`);
            const downloadData = await downloadResponse.json().catch(() => null);

            if (downloadResponse.ok && downloadData?.delivery === 'signed-url' && downloadData?.url) {
              window.location.href = downloadData.url;
            } else {
              window.location.href = `${data.downloadUrl}${email}`;
            }
          }
          setViewState('landing');
        }
      } catch (err) {
        console.error('Failed to verify bot purchase:', err);
      }

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
    if (creditsRemaining < FEATURE_PRICING['promo-generation'].creditsRequired) {
      setShowPurchaseModal(true);
      return;
    }
    
    // Reset output but keep customization settings
    setError(null);
    setAnalysis(null);
    setImageBase64(null);
    setFinalImage(null);
    setActiveCopyVariation(-1);
    setContentKitTab('caption');
    setState(AppState.ANALYZING);
    scheduleLoadingProgress();

    // Auto-select optimal aspect ratio for chosen platform
    const platformRatios: Record<SocialPlatform, AspectRatio> = {
      instagram: '4:5',
      tiktok: '9:16',
      facebook: '1:1',
      linkedin: '16:9',
      youtube: '16:9',
    };
    setAspectRatio(platformRatios[platform] || aspectRatio);

    try {
      const promoResult = await generatePromoAsset(url, platform, conversionPreset);
      clearLoadingTimers();
      setAnalysis(promoResult.analysis);
      setImageBase64(promoResult.imageBase64);
      if (typeof promoResult.remainingCredits === 'number') {
        setCreditsRemaining(promoResult.remainingCredits);
      }

      setState(AppState.COMPOSITING);

    } catch (err: any) {
      clearLoadingTimers();
      console.error(err);
      if (err.message?.includes('Demo limit') || err.message?.includes('limit reached') || err.message?.includes('Not enough credits')) {
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

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

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
    return (
      <Suspense fallback={<PageLoader label="Loading Free Tools" />}>
        <FreeToolsPage onBack={() => setViewState('landing')} onLaunchPromofinder={launchPromofinder} isSignedIn={!!user} />
      </Suspense>
    );
  }
  if (viewState === 'perplexity') {
    return (
      <Suspense fallback={<PageLoader label="Loading Perplexity" />}>
        <PerplexityPage onBack={() => setViewState('landing')} />
      </Suspense>
    );
  }
  if (viewState === 'veo-studio') {
    return (
      <Suspense fallback={<PageLoader label="Loading Veo Studio" />}>
        <VeoStudioPage
          onBack={() => setViewState(user ? 'app' : 'landing')}
          user={user}
          creditsRemaining={creditsRemaining}
          onRequireAuth={() => openAuth('signup')}
          onRequirePurchase={() => setShowPurchaseModal(true)}
          onCreditsUpdated={(remaining) => setCreditsRemaining(remaining)}
        />
      </Suspense>
    );
  }
  if (viewState === 'title-scorer') {
    return (
      <Suspense fallback={<PageLoader label="Loading Title Scorer" />}>
        <TitleScorerPage
          onBack={() => setViewState('landing')}
          onOpenTool={(v) => setViewState(v as ViewState)}
          user={user}
          creditsRemaining={creditsRemaining}
          onRequireAuth={() => openAuth('signup')}
          onRequirePurchase={() => setShowPurchaseModal(true)}
          onCreditsUpdated={(remaining) => setCreditsRemaining(remaining)}
        />
      </Suspense>
    );
  }
  if (viewState === 'upload-auditor' || viewState === 'title-tracker' || viewState === 'hook-library' || viewState === 'thumbnail-checker') {
    return (
      <ToolViews
        view={viewState}
        onBack={() => setViewState('landing')}
        onOpenTool={(v) => setViewState(v as ViewState)}
        user={user}
        creditsRemaining={creditsRemaining}
        onRequireAuth={() => openAuth('signup')}
        onRequirePurchase={() => setShowPurchaseModal(true)}
        onCreditsUpdated={(remaining) => setCreditsRemaining(remaining)}
      />
    );
  }
  if (viewState === 'muse-course') {
    return (
      <Suspense fallback={<PageLoader label="Loading Muse Course" />}>
        <MuseCoursePage
          onBack={() => setViewState('landing')}
          user={user}
          onRequireAuth={() => openAuth('signup')}
          onNavigate={(view) => setViewState(view as ViewState)}
        />
      </Suspense>
    );
  }
  if (viewState === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 text-white">
            <div className="pg-bg" />
            <div className="flex min-h-screen items-center justify-center px-6">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-8 py-10 text-center shadow-2xl shadow-black/20">
                <RefreshCw className="mx-auto h-8 w-8 animate-spin text-violet-300" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Loading Admin Tools</p>
              </div>
            </div>
          </div>
        }
      >
        <AdminDashboardPage
          onBack={closeAdminDashboard}
          onAccessGranted={() => setIsAdminSessionActive(true)}
          onAccessRevoked={() => setIsAdminSessionActive(false)}
        />
      </Suspense>
    );
  }

  // Legal Pages
  if (viewState === 'privacy') {
    return (
      <Suspense fallback={<PageLoader label="Loading Privacy Policy" />}>
        <PrivacyPolicy onBack={() => setViewState('landing')} />
      </Suspense>
    );
  }
  if (viewState === 'terms') {
    return (
      <Suspense fallback={<PageLoader label="Loading Terms" />}>
        <TermsOfService onBack={() => setViewState('landing')} />
      </Suspense>
    );
  }
  if (viewState === 'refund') {
    return (
      <Suspense fallback={<PageLoader label="Loading Refund Policy" />}>
        <RefundPolicy onBack={() => setViewState('landing')} />
      </Suspense>
    );
  }
  if (viewState === 'contact') {
    return (
      <Suspense fallback={<PageLoader label="Loading Contact Page" />}>
        <ContactPage onBack={() => setViewState('landing')} />
      </Suspense>
    );
  }

  // Show landing page
  if (viewState === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 relative">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/30">
                4
              </div>
              <div>
                <h1 className="text-lg font-bold font-display tracking-wide">4ourMedia</h1>
                <p className="text-xs text-slate-400">Research + creative tools</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <MobileLandingNav onNavigate={(view) => setViewState(view)} />
              <button
                onClick={() => setViewState('veo-studio')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🎥 Veo Studio
              </button>
              <button
                onClick={() => setViewState('title-scorer')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                📝 Title Scorer
              </button>
              <button
                onClick={() => setViewState('upload-auditor')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                ✅ Upload Auditor
              </button>
              <button
                onClick={() => setViewState('title-tracker')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🧪 Title Tracker
              </button>
              <button
                onClick={() => setViewState('hook-library')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🪝 Hook Library
              </button>
              <button
                onClick={() => setViewState('thumbnail-checker')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🖼️ Thumbnail Checker
              </button>
              <button
                onClick={() => setViewState('muse-course')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🎓 Free Muse Course
              </button>
              <button
                onClick={() => setViewState('free-tools')}
                className="hidden md:block px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                🎬 Promofinder Suite
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
                Open PromoGen
              </button>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                PromoGen Credits
              </button>
            </div>
          </div>
        </header>
        
        <LandingPage 
          onGetStarted={() => user ? setViewState('app') : openAuth('signup')}
          onLaunchPromofinder={launchPromofinder}
          onPurchase={(planId: string) => {
            setSelectedPlan(planId);
            setShowPurchaseModal(true);
          }}
          onPurchaseBot={(planId: string) => {
            setSelectedBotPlan(planId);
            setShowBotPurchaseModal(true);
          }}
          onNavigate={(page: string) => setViewState(page as ViewState)}
        />

        {showBotPurchaseModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Autopilot Bot Pack Checkout</h3>
                <button
                  onClick={() => setShowBotPurchaseModal(false)}
                  className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-300 text-sm mb-3">
                Selected package: <span className="font-semibold text-indigo-300">{selectedBotPlan}</span>
              </p>
              <p className="text-slate-400 text-sm mb-5">
                This package includes downloadable bot templates, personality presets, and setup documentation with BYOK model guidance.
              </p>
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 mb-5">
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Next step: wire these packages to Stripe product IDs and secure download delivery (Supabase storage + signed links).
                  I can complete this end-to-end as the next action.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => setShowBotPurchaseModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowBotPurchaseModal(false);
                    const successUrl = `${window.location.origin}/?botPurchase=success&botPlan=${encodeURIComponent(selectedBotPlan)}&bot_session_id={CHECKOUT_SESSION_ID}`;
                    const cancelUrl = `${window.location.origin}/#bot-store`;
                    fetch(`${API_BASE}/api/purchase/bot-checkout`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        planId: selectedBotPlan,
                        userId: user?.id || '',
                        userEmail: user?.email || '',
                        successUrl,
                        cancelUrl,
                      }),
                    })
                      .then(async (res) => {
                        const data = await res.json();
                        if (res.ok && data?.url) {
                          window.location.href = data.url;
                          return;
                        }
                        throw new Error(data?.error || 'Unable to start checkout');
                      })
                      .catch((err) => {
                        console.error('Bot checkout error:', err);
                        alert('Unable to start bot checkout right now. Please try again.');
                      });
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          </div>
        )}
        
        <LandingFooter
          onOpenPromoGen={() => user ? setViewState('app') : openAuth('signup')}
          onPurchase={() => setShowPurchaseModal(true)}
          onNavigate={(view) => setViewState(view)}
        />
        
        {/* Auth Modal */}
        {showAuthModal && (
          <Suspense fallback={<ModalLoader label="Loading Sign In" />}>
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onAuthSuccess={handleAuthSuccess}
              initialMode={authMode}
            />
          </Suspense>
        )}
        
        {/* Purchase Modal */}
        {showPurchaseModal && (
          <Suspense fallback={<ModalLoader label="Loading Checkout" />}>
            <PurchaseModal 
              isOpen={showPurchaseModal} 
              onClose={() => setShowPurchaseModal(false)}
              creditsRemaining={creditsRemaining}
              selectedPlan={selectedPlan}
              userId={user?.id}
              userEmail={user?.email}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white flex flex-col">
      
      {/* Auth Modal */}
      {showAuthModal && (
        <Suspense fallback={<ModalLoader label="Loading Sign In" />}>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            initialMode={authMode}
          />
        </Suspense>
      )}
      
      {/* Purchase Modal */}
      {showPurchaseModal && (
        <Suspense fallback={<ModalLoader label="Loading Checkout" />}>
          <PurchaseModal 
            isOpen={showPurchaseModal} 
            onClose={() => setShowPurchaseModal(false)}
            creditsRemaining={creditsRemaining}
            selectedPlan={selectedPlan}
            userId={user?.id}
            userEmail={user?.email}
          />
        </Suspense>
      )}
      
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
                  <FlameIcon size={14} className="inline-block text-orange-400 mr-1" /> {streakDays} day streak! Keep it up!
                </span>
              )}
            </p>
            {streakDays === 6 && (
              <p className="text-yellow-300 text-sm mb-4 font-semibold flex items-center justify-center gap-1">
                <SparklesIcon size={14} className="text-yellow-300" /> 1 more day for 2 BONUS credits!
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
        <div className="container mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
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
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 flex-wrap justify-end">
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
              onClick={() => setViewState('veo-studio')}
              className="hidden md:flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400 hover:text-white"
              title="Veo Studio"
            >
              <Film className="w-4 h-4" />
              <span className="hidden lg:inline">Veo Studio</span>
            </button>

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
              className="px-2.5 md:px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-1"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{hasPurchased ? 'More Credits' : 'Get Credits'}</span>
            </button>
            
            {/* User Account */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu((current) => !current)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                </button>
                <div
                  className={`absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700 transition-all z-50 ${
                    showUserMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        openAdminDashboard();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      {isAdminSessionActive ? 'Admin Dashboard' : 'Admin Access'}
                    </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSignOut();
                    }}
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
      <main className="flex-1">
        <Suspense fallback={<PageLoader label="Loading Script Builder" />}>
          <ScriptBuilderPage
            onBack={() => setViewState('landing')}
            onOpenTool={(v) => setViewState(v as ViewState)}
            user={user}
            creditsRemaining={creditsRemaining}
            onRequireAuth={() => openAuth('signup')}
            onRequirePurchase={() => setShowPurchaseModal(true)}
            onCreditsUpdated={(remaining) => setCreditsRemaining(remaining)}
          />
        </Suspense>
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
