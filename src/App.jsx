// BUILD-FP: src/App.jsx loaded
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, Shield, Zap, LogIn, Star, Github } from 'lucide-react'
import { supabase } from './supabaseClient'
import { STRIPE_PRICES } from './stripeConfig'
import { ThemeProvider } from './contexts/ThemeContext'
import Humanizer from './components/Humanizer'
import AIDetector from './components/AIDetector'
import SavedEssays from './components/SavedEssays'
import CitationGenerator from './components/CitationGenerator'
import EssayGenerator from './components/EssayGenerator'
import RewriteHistoryTracker from './components/RewriteHistoryTracker'
import ToneMapper from './components/ToneMapper'
import ReadabilitySculptor from './components/ReadabilitySculptor'
import IdeaToOutline from './components/IdeaToOutline'
import EssayGradePredictor from './components/EssayGradePredictor'
import ArgumentHeatmap from './components/ArgumentHeatmap'
import EssayAnalyzer from './components/EssayAnalyzer'
import Settings from './components/Settings'
import AdminDashboard from './components/AdminDashboard'

// Minimal UI primitives (no external UI kit)
function Button({ className = '', variant, size, disabled, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    default: "bg-indigo-500 hover:bg-indigo-400 text-white",
    secondary: "bg-white text-black hover:bg-white/90",
    outline: "border border-white/20 text-white hover:bg-white/5",
    ghost: "bg-transparent text-white/80 hover:text-white"
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-2.5 text-base" };
  const v = variants[variant || "default"]; const s = sizes[size || "md"];
  return <button disabled={disabled} className={`${base} ${v} ${s} ${className}`} {...props} />;
}
function Card({ className = '', ...props }) { return <div className={`rounded-2xl border ${className}`} {...props} /> }
function CardHeader({ className = '', ...props }) { return <div className={`px-6 pt-6 ${className}`} {...props} /> }
function CardTitle({ className = '', ...props }) { return <div className={`text-lg font-semibold ${className}`} {...props} /> }
function CardContent({ className = '', ...props }) { return <div className={`px-6 pb-6 ${className}`} {...props} /> }

export default function App() {
  const [page, setPage] = useState('home')
  const [yearly, setYearly] = useState(false);
  const showcaseRef = useRef(null)

  // auth + ui state
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2600); };

  // Auth flow states
  const [authMode, setAuthMode] = useState('choose'); // 'choose', 'login', 'signup', 'verify-email', 'verify-login', 'forgot-password', 'reset-password'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Discord integration states
  const [discordLinkCode, setDiscordLinkCode] = useState('');
  const [discordLink, setDiscordLink] = useState(null);
  const [discordLoading, setDiscordLoading] = useState(false);

  // Subscription state
  const [userSubscription, setUserSubscription] = useState(null);

  // Stats state
  const [userCount, setUserCount] = useState(0);

  // settings state
  const [emailNotifications, setEmailNotifications] = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  // Docs/Updates entries
  const updates = [
    {
      version: "v1.1.0",
      date: "2025-10-14",
      title: "Control Panel & UI Updates",
      items: [
        "New Control Panel with tier-based feature access",
        "Replaced Download button with Control Panel access",
        "Added 6 feature cards: Humanizer, AI Detector, Essay Writer, Saved Essays, Grammar Check, Citation Generator",
        "Dynamic user stats now show real-time user count",
        "Usage statistics dashboard with tier limits",
        "Smooth glowing animations on cards",
        "Upgraded CTA for non-premium users",
        "Folder organization: SQL, docs, scripts directories",
      ],
    },
    {
      version: "v1.0.1",
      date: "2025-10-09",
      title: "Fixes & polish",
      items: [
        "Community page layout fix (single footer)",
        "Larger menu hit areas for user dropdown",
        "Docs page added (this page)",
      ],
    },
    {
      version: "v1.0",
      date: "2025-10-09",
      title: "Live",
      items: [
        "Landing hero, features, stats, and pricing",
        "Download page with platform cards",
        "Login & signup with themed toasts",
        "Community page + Discord launcher",
        "Prototype Control Panel layout",
      ],
    },
  ];

  const features = [
    { icon: <Zap className="w-5 h-5" />, title: "Fast setup", text: "Plug-and-play onboarding with sane defaults." },
    { icon: <Shield className="w-5 h-5" />, title: "Privacy-first", text: "Local controls with transparent permissions." },
    { icon: <Star className="w-5 h-5" />, title: "Pro toolkit", text: "Smart macros, presets, and autosave." },
  ];

  const tiers = [
    { name: "Basic", priceM: 5, priceY: 48, cta: "Get Basic", highlights: ["Core typing engine", "10 saved presets", "Email support"], popular: false },
    { name: "Pro", priceM: 15, priceY: 144, cta: "Go Pro", highlights: ["All Basic features", "Unlimited presets", "Stealth mode & hotkeys", "Priority support"], popular: true },
    { name: "Premium", priceM: 29, priceY: 276, cta: "Go Premium", highlights: ["All Pro features", "Priority support", "Advanced customization"], popular: false },
  ];

  // Check for existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user count on mount
  useEffect(() => {
    const loadUserCount = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_count');

        if (error) {
          console.error('Error loading user count:', error);
        } else {
          setUserCount(data || 0);
        }
      } catch (error) {
        console.error('Error in loadUserCount:', error);
      }
    };

    loadUserCount();
  }, []);

  // Load Discord link and subscription when user changes
  useEffect(() => {
    if (user) {
      loadDiscordLink();
      loadUserSubscription();
      checkAdminStatus();

      // Subscribe to real-time subscription changes
      const subscriptionChannel = supabase
        .channel('user_subscription_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Subscription changed:', payload);
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setUserSubscription(payload.new);
              showToast(`Subscription updated to ${payload.new.tier}!`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscriptionChannel);
      };
    } else {
      setDiscordLink(null);
      setUserSubscription(null);
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin status:', error);
      }

      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      setIsAdmin(false);
    }
  };

  const loadDiscordLink = async () => {
    try {
      const { data, error } = await supabase
        .from('discord_links')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading Discord link:', error);
        return;
      }

      setDiscordLink(data);
    } catch (error) {
      console.error('Error in loadDiscordLink:', error);
    }
  };

  const loadUserSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        // If no subscription found, set default to basic
        setUserSubscription({ tier: 'basic', status: 'active' });
        return;
      }

      if (data) {
        console.log('Loaded subscription:', data);
        setUserSubscription(data);
      } else {
        console.log('No subscription found, defaulting to basic');
        // Default to basic if no subscription exists
        setUserSubscription({ tier: 'basic', status: 'active' });
      }
    } catch (error) {
      console.error('Error in loadUserSubscription:', error);
      // Fallback to basic tier on error
      setUserSubscription({ tier: 'basic', status: 'active' });
    }
  };

  useEffect(() => {
    try {
      const sections = Array.from(document.querySelectorAll('section'));
      if (page === 'home') {
        console.assert(sections.length >= 3, 'Expected 3+ <section> elements on home page.');
      } else if (page === 'download') {
        console.assert(sections.length === 1, 'Expected 1 <section> on the download page.');
      } else if (page === 'login') {
        console.assert(sections.length === 1, 'Expected 1 <section> on the login page.');
      } else if (page === 'docs') {
        console.assert(sections.length === 1, 'Expected 1 <section> on the docs page.');
      }
    } catch {}
  }, [page]);

  const gotoShowcase = () => showcaseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Stripe checkout handler
  const handleCheckout = async (tier, billingPeriod) => {
    if (!user) {
      showToast('Please log in to subscribe');
      setPage('login');
      return;
    }

    try {
      const tierKey = tier.toLowerCase();
      const periodKey = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
      const priceId = STRIPE_PRICES[tierKey]?.[periodKey];

      if (!priceId) {
        showToast('Price configuration error. Please contact support.');
        return;
      }

      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          userEmail: user.email,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Failed to start checkout. Please try again.');
    }
  };

  // Calculate annual savings
  const calculateAnnualSavings = (monthlyPrice, yearlyPrice) => {
    const monthlyCostForYear = monthlyPrice * 12;
    const savings = monthlyCostForYear - yearlyPrice;
    const percentSavings = Math.round((savings / monthlyCostForYear) * 100);
    return { savings, percentSavings };
  };

  // Get username color based on subscription tier
  const getUsernameColor = () => {
    const tier = userSubscription?.tier?.toLowerCase();
    if (tier === 'premium') return 'text-yellow-400'; // Gold
    if (tier === 'pro') return 'text-red-400'; // Red
    return 'text-gray-400'; // Grey for basic or no subscription
  };

  console.log('App component rendering, page:', page);

  return (
    <ThemeProvider>
      <style>{`
        @keyframes softPulse {
          0%, 100% { box-shadow: 0 0 35px rgba(99,102,241,.35); }
          50% { box-shadow: 0 0 45px rgba(99,102,241,.48); }
        }
        @keyframes neonFlicker {
          0%, 100% { opacity: 1; }
          35% { opacity: 0.8; }
          37% { opacity: 0.9; }
          39% { opacity: 0.8; }
          42% { opacity: 1; }
          78% { opacity: 0.9; }
          80% { opacity: 1; }
        }
        .pulse-glow {
          animation: softPulse 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .neon-text {
          text-shadow: 0 0 10px rgba(139,92,246,.7),
                       0 0 20px rgba(139,92,246,.5),
                       0 0 30px rgba(139,92,246,.3);
          animation: neonFlicker 8s infinite;
        }
        .glass-effect {
          backdrop-filter: blur(12px);
          background: linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-[#0b0c10] via-[#12141c] to-[#0b0c10] text-white">
        {/* Glow backdrop */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-24 left-1/2 h-96 w-[68rem] -translate-x-1/2 rounded-full blur-3xl opacity-30"
               style={{ background: "radial-gradient(closest-side, rgba(139,92,246,.5), rgba(0,0,0,0))" }} />
          <div className="absolute top-48 right-1/4 h-64 w-[45rem] -translate-x-1/2 rounded-full blur-3xl opacity-20"
               style={{ background: "radial-gradient(closest-side, rgba(56,189,248,.4), rgba(0,0,0,0))" }} />
          <div className="absolute -bottom-32 left-1/3 h-96 w-[55rem] -translate-x-1/3 rounded-full blur-3xl opacity-20"
               style={{ background: "radial-gradient(closest-side, rgba(99,102,241,.45), rgba(0,0,0,0))" }} />
        </div>

        <div className="relative min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-10 flex-shrink-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
              <div className="h-8 w-8 rounded-md bg-black grid place-items-center ring-1 ring-purple-500/40 shadow-[0_0_18px_rgba(168,85,247,.35)]">
                {/* Neon O logo */}
                <svg viewBox="0 0 100 100" className="h-6 w-6">
                  <defs>
                    <radialGradient id="g" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="28" fill="none" stroke="url(#g)" strokeWidth="10" style={{filter:"drop-shadow(0 0 6px rgba(168,85,247,.9))"}} />
                </svg>
              </div>
              <span className="font-semibold tracking-tight text-white/90">Ovara</span>
            </div>
            {!['control', 'humanizer', 'ai-detector', 'essay-generator', 'saved-essays', 'citation-generator', 'rewrite-history', 'tone-mapper', 'idea-to-outline', 'essay-analyzer'].includes(page) && (
              <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
                <button className="hover:text-white transition" onClick={() => setPage('home')}>Home</button>
                <button className="hover:text-white transition" onClick={() => setPage('features')}>Features</button>
                <button className="hover:text-white transition" onClick={() => setPage('pricing')}>Plans</button>
                <button className="hover:text-white transition" onClick={() => setPage('docs')}>Docs</button>
                <button className="hover:text-white transition" onClick={() => setPage('download')}>Download</button>
              </nav>
            )}
            <div className="flex items-center gap-3">
              {!user ? (<>
                <Button variant="ghost" className="text-white/80 hover:text-white" onClick={() => setPage('login')}>Log in</Button>
                <Button className="bg-indigo-500 hover:bg-indigo-400" onClick={() => setPage('download')}>Download</Button>
              </>) : (
                <div className="relative">
                  <button
                    onClick={()=>setMenuOpen(!menuOpen)}
                    className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"/>
                    <span className={getUsernameColor()}>{user.email?.split('@')[0] || 'User'}</span>
                    <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-80"><path fill="currentColor" d="M5 7l5 6 5-6z"/></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* HOME */}
        {page === 'home' && (<>
          <section className="relative z-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> v1.0 — Live
              </span>
              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                <span className="neon-text">Ovara</span> — <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">The Writing Tool</span>
              </h1>
              <p className="mt-5 max-w-2xl text-white/90 text-lg font-medium">Ease homework. Draft faster. Tighter focus for essays and research.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-indigo-500 hover:bg-indigo-400"
                  onClick={() => {
                    if (!user) {
                      showToast('Please log in to access Control Panel');
                      setPage('login');
                    } else {
                      setPage('control');
                    }
                  }}
                >
                  Control Panel <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90" onClick={gotoShowcase}>
                  See in Action
                </Button>
              </div>

              {/* Stats styled like download cards */}
              <div className="mt-12 grid grid-cols-3 md:grid-cols-3 gap-4 w-full">
                {[
                  { k: userCount > 0 ? userCount.toString() : "0", v: "Users" },
                  { k: "20+", v: "Features" },
                  { k: "50+", v: "Commands" },
                ].map((s) => (
                  <Card key={s.v} className="bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_35px_rgba(99,102,241,.35)] hover:shadow-[0_0_55px_rgba(99,102,241,.55)] transition pulse-glow">
                    <CardContent className="py-7 text-center">
                      <div className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow text-indigo-100">{s.k}</div>
                      <div className="text-xs md:text-sm text-indigo-200 mt-1">{s.v}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="relative z-10 py-12 md:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((f) => (
                  <Card key={f.title} className="bg-white/5 border-white/10">
                    <CardHeader className="flex-row items-center gap-3">
                      <div className="rounded-xl bg-white/10 p-2">{f.icon}</div>
                      <CardTitle className="text-white">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-white/70 mt-2">{f.text}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Showcase */}
          <section ref={showcaseRef} className="relative z-10 py-6 md:py-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/10">
                <CardContent className="p-0">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center">
                    <div className="text-white/60 text-sm">Drop your extension GIF / screenshot here</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="relative z-10 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-3xl md:text-4xl font-bold">Choose your plan</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className={!yearly ? "text-white" : "text-white/50"}>Monthly</span>
                  <button onClick={() => setYearly((v) => !v)} className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10">
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${yearly ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                  <span className={yearly ? "text-white" : "text-white/50"}>Yearly</span>
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-6">
                {tiers.map((t) => {
                  const { savings, percentSavings } = calculateAnnualSavings(t.priceM, t.priceY);
                  return (
                    <Card key={t.name} className={`bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_35px_rgba(99,102,241,.35)] hover:shadow-[0_0_55px_rgba(99,102,241,.55)] transition pulse-glow ${t.popular ? "ring-2 ring-indigo-400" : ""}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-indigo-300 drop-shadow">{t.name}</CardTitle>
                          {t.popular && (<span className="rounded-full bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5">Most popular</span>)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          ${yearly ? t.priceY : t.priceM}
                          <span className="text-sm text-indigo-200">/{yearly ? "yr" : "mo"}</span>
                        </div>
                        {yearly && (
                          <div className="mt-2 text-sm text-emerald-400 font-medium">
                            Save ${savings} ({percentSavings}%) vs monthly
                          </div>
                        )}
                        {!yearly && (
                          <div className="mt-2 text-sm text-indigo-300/80">
                            ${t.priceY}/yr saves {percentSavings}%
                          </div>
                        )}
                        <ul className="mt-4 space-y-2 text-sm text-indigo-100/90">
                          {t.highlights.map((h) => (<li key={h} className="flex items-center gap-2"><Check className="h-4 w-4" /> {h}</li>))}
                        </ul>
                        <Button
                          className="mt-6 w-full bg-indigo-500 hover:bg-indigo-400"
                          onClick={() => handleCheckout(t.name, yearly ? 'yearly' : 'monthly')}
                        >
                          {t.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        </>)}

        {/* DOWNLOAD PAGE */}
        {page === 'download' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Download Ovara</h1>
              <p className="mt-3 text-white/80 max-w-2xl">Choose your platform and get started in seconds.</p>
              <div className="mt-8 grid md:grid-cols-3 gap-6">
                {[
                  { name: "Chrome", note: "Coming soon" },
                  { name: "Edge", note: "Coming soon" },
                  { name: "Firefox", note: "Coming soon" },
                ].map((d) => (
                  <Card key={d.name} className="bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_35px_rgba(99,102,241,.35)] hover:shadow-[0_0_55px_rgba(99,102,241,.55)] transition pulse-glow">
                    <CardHeader><CardTitle className="text-indigo-300 drop-shadow">{d.name}</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-white text-sm font-medium">{d.note}</p>
                      <Button disabled className="mt-4 w-full bg-indigo-500 hover:bg-indigo-500/90 shadow-[0_0_30px_rgba(99,102,241,.45)] cursor-not-allowed">Coming soon</Button>
                      <button onClick={() => setPage('login')} className="mt-3 w-full text-center text-indigo-200/95 hover:text-white underline text-xs">Join the waitlist</button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* LOGIN PAGE - Complete Authentication System */}
        {page === 'login' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
              {/* Choose Login or Create Account */}
              {authMode === 'choose' && (
                <>
                  <h1 className="text-3xl font-bold">Welcome to Ovara</h1>
                  <p className="text-white/70 mt-1 text-sm">Choose an option to continue</p>
                  <Card className="mt-6 bg-white/5 border-white/10">
                    <CardContent className="pt-6 space-y-3">
                      <Button
                        className="w-full bg-indigo-500 hover:bg-indigo-400"
                        onClick={() => { setAuthMode('login'); setAuthError(''); }}
                      >
                        Log In
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/5"
                        onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                      >
                        Create Account
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Create Account Flow */}
              {authMode === 'signup' && (
                <>
                  <h1 className="text-3xl font-bold">Create Account</h1>
                  <p className="text-white/70 mt-1 text-sm">Sign up with your email</p>
                  <Card className="mt-6 bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                      <form className="space-y-3" onSubmit={async (e) => {
                        e.preventDefault();
                        setAuthError('');

                        if (!authEmail || !authPassword) {
                          setAuthError('Please fill in all fields');
                          return;
                        }

                        if (authPassword !== authPasswordConfirm) {
                          setAuthError('Passwords do not match');
                          return;
                        }

                        if (authPassword.length < 6) {
                          setAuthError('Password must be at least 6 characters');
                          return;
                        }

                        setAuthLoading(true);

                        const { data, error } = await supabase.auth.signUp({
                          email: authEmail,
                          password: authPassword,
                        });

                        setAuthLoading(false);

                        if (error) {
                          setAuthError(error.message);
                        } else {
                          showToast('Account created! Please check your email for verification.');
                          setAuthMode('verify-email');
                        }
                      }}>
                        <div>
                          <label className="block text-sm text-white/70">Email</label>
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400 text-white"
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70">Password</label>
                          <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400 text-white"
                            placeholder="Create a password"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70">Confirm Password</label>
                          <input
                            type="password"
                            value={authPasswordConfirm}
                            onChange={(e) => setAuthPasswordConfirm(e.target.value)}
                            className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400 text-white"
                            placeholder="Confirm your password"
                            required
                          />
                        </div>
                        {authError && <p className="text-red-400 text-sm">{authError}</p>}
                        <Button className="w-full bg-indigo-500 hover:bg-indigo-400" type="submit" disabled={authLoading}>
                          {authLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('choose'); setAuthEmail(''); setAuthPassword(''); setAuthPasswordConfirm(''); setAuthError(''); }}
                          className="w-full text-center text-indigo-300 hover:text-white text-sm"
                        >
                          Back
                        </button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Email Verification */}
              {authMode === 'verify-email' && (
                <>
                  <h1 className="text-3xl font-bold">Verify Your Email</h1>
                  <p className="text-white/70 mt-1 text-sm">We sent a verification link to {authEmail}</p>
                  <Card className="mt-6 bg-white/5 border-white/10">
                    <CardContent className="pt-6 space-y-3">
                      <p className="text-white/80 text-sm">Please check your email and click the verification link to activate your account.</p>
                      <Button
                        className="w-full bg-indigo-500 hover:bg-indigo-400"
                        onClick={() => {
                          setAuthMode('choose');
                          setAuthEmail('');
                          setAuthPassword('');
                          setAuthPasswordConfirm('');
                          showToast('You can now log in with your verified account');
                        }}
                      >
                        Back to Login
                      </Button>
                      <button
                        onClick={async () => {
                          const { error } = await supabase.auth.resend({
                            type: 'signup',
                            email: authEmail,
                          });
                          if (error) {
                            showToast('Error resending email');
                          } else {
                            showToast('Verification email resent!');
                          }
                        }}
                        className="w-full text-center text-indigo-300 hover:text-white text-sm"
                      >
                        Resend verification email
                      </button>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Login Flow */}
              {authMode === 'login' && (
                <>
                  <h1 className="text-3xl font-bold">Log In</h1>
                  <p className="text-white/70 mt-1 text-sm">Welcome back!</p>
                  <Card className="mt-6 bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                      <form className="space-y-3" onSubmit={async (e) => {
                        e.preventDefault();
                        setAuthError('');

                        if (!authEmail || !authPassword) {
                          setAuthError('Please fill in all fields');
                          return;
                        }

                        setAuthLoading(true);

                        const { data, error } = await supabase.auth.signInWithPassword({
                          email: authEmail,
                          password: authPassword,
                        });

                        setAuthLoading(false);

                        if (error) {
                          setAuthError(error.message);
                        } else {
                          showToast('Welcome back!');
                          setPage('home');
                          setAuthMode('choose');
                          setAuthEmail('');
                          setAuthPassword('');
                        }
                      }}>
                        <div>
                          <label className="block text-sm text-white/70">Email</label>
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400 text-white"
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/70">Password</label>
                          <input
                            type="password"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400 text-white"
                            placeholder="••••••••"
                            required
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-white/70">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="accent-indigo-500"
                            />
                            Remember me
                          </label>
                          <button
                            type="button"
                            onClick={() => { setAuthMode('forgot-password'); setAuthError(''); }}
                            className="text-xs text-indigo-300 hover:text-indigo-200"
                          >
                            Forgot password?
                          </button>
                        </div>
                        {authError && <p className="text-red-400 text-sm">{authError}</p>}
                        <Button className="w-full bg-indigo-500 hover:bg-indigo-400" type="submit" disabled={authLoading}>
                          {authLoading ? 'Logging in...' : 'Sign in'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('choose'); setAuthEmail(''); setAuthPassword(''); setAuthError(''); }}
                          className="w-full text-center text-indigo-300 hover:text-white text-sm"
                        >
                          Back
                        </button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Forgot Password Flow */}
              {authMode === 'forgot-password' && (
                <>
                  <h1 className="text-3xl font-bold">Reset Password</h1>
                  <p className="text-white/70 mt-1 text-sm">Enter your email to receive a reset link</p>
                  <Card className="mt-6 bg-white/5 border-white/10">
                    <CardContent className="pt-6">
                      <form className="space-y-3" onSubmit={async (e) => {
                        e.preventDefault();
                        setAuthError('');

                        if (!authEmail) {
                          setAuthError('Please enter your email');
                          return;
                        }

                        setAuthLoading(true);

                        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
                          redirectTo: window.location.origin + '/?reset=true',
                        });

                        setAuthLoading(false);

                        if (error) {
                          setAuthError(error.message);
                        } else {
                          showToast('Password reset email sent!');
                          setAuthMode('login');
                        }
                      }}>
                        <div>
                          <label className="block text-sm text-white/70">Email</label>
                          <input
                            type="email"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400 text-white"
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        {authError && <p className="text-red-400 text-sm">{authError}</p>}
                        <Button className="w-full bg-indigo-500 hover:bg-indigo-400" type="submit" disabled={authLoading}>
                          {authLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setAuthEmail(''); setAuthError(''); }}
                          className="w-full text-center text-indigo-300 hover:text-white text-sm"
                        >
                          Back to Login
                        </button>
                      </form>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </section>
        )}

        {/* Community Page */}
        {page === 'community' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
              <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_35px_rgba(99,102,241,.45)]">
                <CardHeader>
                  <CardTitle className="text-indigo-200 text-2xl">Join the Ovara Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 text-sm">Hop into our Discord to get updates, report issues, and meet other users. Click below to join.</p>
                  <Button className="mt-4 w-full" onClick={()=>{ const url = localStorage.getItem('ovara_discord_url') || '#'; if(url==='#'){ showToast('Set ovara_discord_url in localStorage to enable'); } else { window.open(url, '_blank'); } }}>Open Discord</Button>
                  <p className="text-xs text-white/50 mt-3">We'll replace this with your real invite once you share it.</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Docs Page */}
        {page === 'docs' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl font-extrabold tracking-tight">Docs / Updates</h1>
              <p className="text-white/70 mt-2">Latest releases, fixes, and improvements.</p>
              <div className="mt-6 space-y-4">
                {updates.map(u => (
                  <Card key={u.version} className="bg-white/10 border-white/20">
                    <CardHeader>
                      <CardTitle className="text-indigo-200">{u.version} — {u.title} <span className="text-xs text-white/50 ml-2">{u.date}</span></CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 text-sm text-white/80 space-y-1">
                        {u.items.map((it, i)=> <li key={i}>{it}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SETTINGS PAGE */}
        {page === 'settings' && (
          <Settings
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('home')}
            onNavigate={setPage}
            emailNotifications={emailNotifications}
            setEmailNotifications={setEmailNotifications}
            discordLink={discordLink}
            setDiscordLink={setDiscordLink}
            discordLinkCode={discordLinkCode}
            setDiscordLinkCode={setDiscordLinkCode}
            discordLoading={discordLoading}
            setDiscordLoading={setDiscordLoading}
            loadDiscordLink={loadDiscordLink}
          />
        )}

        {/* CONTROL PANEL */}
        {page === 'control' && (
          <section className="relative z-10 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Control Panel</h1>
                  <p className="text-white/60 mt-1">
                    Welcome back, {user?.email?.split('@')[0] || 'User'} •{' '}
                    <span className={
                      userSubscription?.tier === 'premium' ? 'text-yellow-400' :
                      userSubscription?.tier === 'pro' ? 'text-red-400' :
                      'text-gray-400'
                    }>
                      {userSubscription?.tier ? userSubscription.tier.charAt(0).toUpperCase() + userSubscription.tier.slice(1) : 'Basic'} Plan
                    </span>
                  </p>
                </div>
                <Button variant="outline" onClick={() => setPage('home')}>
                  Back to Home
                </Button>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Humanizer */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-indigo-300">Humanizer</CardTitle>
                      {(!userSubscription || userSubscription.tier === 'basic') && (
                        <span className="text-xs text-yellow-400">Pro+</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Make AI-generated text sound more natural and human-like.</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('humanizer')}
                    >
                      Open Humanizer
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Detector */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">AI Detector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Check if text was generated by AI. Available for all users.</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('ai-detector')}
                    >
                      Open AI Detector
                    </Button>
                  </CardContent>
                </Card>

                {/* Essay Generator */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Essay Generator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Generate complete essays with citations and formatting.</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('essay-generator')}
                    >
                      Open Essay Generator
                    </Button>
                  </CardContent>
                </Card>

                {/* Saved Essays */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Saved Essays</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">
                      {userSubscription?.tier === 'free' || !userSubscription
                        ? 'Save up to 1 essay'
                        : userSubscription.tier === 'basic'
                        ? 'Save up to 10 essays'
                        : userSubscription.tier === 'pro'
                        ? 'Save up to 50 essays'
                        : 'Unlimited saved essays'}
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('saved-essays')}
                    >
                      View Saved
                    </Button>
                  </CardContent>
                </Card>

                {/* Grammar Check */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Grammar Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Advanced grammar and spell checking for your writing.</p>
                    <Button
                      className="w-full"
                      onClick={() => showToast('Grammar Check coming soon!')}
                    >
                      Open Grammar Check
                    </Button>
                  </CardContent>
                </Card>

                {/* Citation Generator */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-indigo-300">Citation Generator</CardTitle>
                      {(!userSubscription || userSubscription.tier === 'basic') && (
                        <span className="text-xs text-yellow-400">Pro+</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Generate citations in APA, MLA, Chicago, and more.</p>
                    <Button
                      className="w-full"
                      disabled={!userSubscription || userSubscription.tier === 'basic'}
                      onClick={() => setPage('citation-generator')}
                    >
                      {(!userSubscription || userSubscription.tier === 'basic') ? 'Upgrade to Use' : 'Open Generator'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Rewrite History Tracker */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Rewrite History Tracker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Compare text versions with color-coded changes like Git diff.</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('rewrite-history')}
                    >
                      Open Tracker
                    </Button>
                  </CardContent>
                </Card>

                {/* Tone Mapper */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Tone Mapper</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Adjust writing tone (professional, casual, academic, etc.).</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('tone-mapper')}
                    >
                      Open Tone Mapper
                    </Button>
                  </CardContent>
                </Card>

                {/* Idea-to-Outline AI */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Idea-to-Outline AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Transform ideas into structured outlines instantly.</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('idea-to-outline')}
                    >
                      Open Outliner
                    </Button>
                  </CardContent>
                </Card>

                {/* Essay Analyzer */}
                <Card className="bg-white/5 border-white/10 hover:border-white/20 transition">
                  <CardHeader>
                    <CardTitle className="text-indigo-300">Essay Analyzer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/70 text-sm mb-4">Comprehensive essay analysis: grade prediction, readability, and argument strength.</p>
                    <Button
                      className="w-full"
                      onClick={() => setPage('essay-analyzer')}
                    >
                      Analyze Essay
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Stats */}
              <div className="mt-8">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle>Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-2xl font-bold text-indigo-300">0 / {
                          !userSubscription || userSubscription.tier === 'basic' ? '10' :
                          userSubscription.tier === 'pro' ? '50' : '∞'
                        }</div>
                        <div className="text-sm text-white/60 mt-1">Essays Saved</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-indigo-300">0</div>
                        <div className="text-sm text-white/60 mt-1">AI Checks This Month</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-indigo-300">0</div>
                        <div className="text-sm text-white/60 mt-1">Citations Generated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upgrade CTA for non-premium users */}
              {userSubscription?.tier !== 'premium' && (
                <div className="mt-8">
                  <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-400/30">
                    <CardContent className="py-8">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold mb-2">Unlock More Features</h3>
                        <p className="text-white/70 mb-6">
                          {!userSubscription || userSubscription.tier === 'basic'
                            ? 'Upgrade to Pro or Premium for unlimited access to all tools'
                            : 'Upgrade to Premium for Essay Writer and unlimited storage'}
                        </p>
                        <Button size="lg" onClick={() => setPage('pricing')}>
                          View Plans
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PRICING / UPGRADE PAGE */}
        {page === 'pricing' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Upgrade Your Plan</h1>
              <p className="mt-3 text-white/80 max-w-2xl">Choose the plan that fits your needs and unlock powerful features.</p>

              <div className="mt-8 flex items-center justify-center gap-2 text-sm">
                <span className={!yearly ? "text-white" : "text-white/50"}>Monthly</span>
                <button onClick={() => setYearly((v) => !v)} className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10">
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${yearly ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className={yearly ? "text-white" : "text-white/50"}>Yearly</span>
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-6">
                {tiers.map((t) => {
                  const { savings, percentSavings } = calculateAnnualSavings(t.priceM, t.priceY);
                  return (
                    <Card key={t.name} className={`bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_35px_rgba(99,102,241,.35)] hover:shadow-[0_0_55px_rgba(99,102,241,.55)] transition pulse-glow ${t.popular ? "ring-2 ring-indigo-400" : ""}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-indigo-300 drop-shadow text-2xl">{t.name}</CardTitle>
                          {t.popular && (<span className="rounded-full bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5">Most popular</span>)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">
                          ${yearly ? t.priceY : t.priceM}
                          <span className="text-sm text-indigo-200">/{yearly ? "yr" : "mo"}</span>
                        </div>
                        {yearly && (
                          <div className="mt-2 text-sm text-emerald-400 font-medium">
                            Save ${savings} ({percentSavings}%) vs monthly
                          </div>
                        )}
                        {!yearly && (
                          <div className="mt-2 text-sm text-indigo-300/80">
                            ${t.priceY}/yr saves {percentSavings}%
                          </div>
                        )}
                        <ul className="mt-6 space-y-3 text-sm text-indigo-100/90">
                          {t.highlights.map((h) => (<li key={h} className="flex items-center gap-2"><Check className="h-4 w-4 flex-shrink-0" /> {h}</li>))}
                        </ul>
                        <Button
                          className="mt-6 w-full bg-indigo-500 hover:bg-indigo-400 shadow-[0_0_30px_rgba(99,102,241,.45)]"
                          onClick={() => handleCheckout(t.name, yearly ? 'yearly' : 'monthly')}
                        >
                          {t.cta}
                        </Button>
                        <button onClick={() => setPage('features')} className="mt-3 w-full text-center text-indigo-200/95 hover:text-white underline text-xs">See all features</button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* HUMANIZER PAGE */}
        {page === 'humanizer' && (
          <Humanizer
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* AI DETECTOR PAGE */}
        {page === 'ai-detector' && (
          <AIDetector
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* SAVED ESSAYS PAGE */}
        {page === 'saved-essays' && (
          <SavedEssays
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* CITATION GENERATOR PAGE */}
        {page === 'citation-generator' && (
          <CitationGenerator
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* ESSAY GENERATOR PAGE */}
        {page === 'essay-generator' && (
          <EssayGenerator
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* REWRITE HISTORY TRACKER PAGE */}
        {page === 'rewrite-history' && (
          <RewriteHistoryTracker
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* TONE MAPPER PAGE */}
        {page === 'tone-mapper' && (
          <ToneMapper
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* IDEA-TO-OUTLINE PAGE */}
        {page === 'idea-to-outline' && (
          <IdeaToOutline
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* ESSAY ANALYZER PAGE */}
        {page === 'essay-analyzer' && (
          <EssayAnalyzer
            user={user}
            userSubscription={userSubscription}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* ADMIN DASHBOARD PAGE */}
        {page === 'admin' && (
          <AdminDashboard
            user={user}
            showToast={showToast}
            onBack={() => setPage('control')}
          />
        )}

        {/* FEATURES PAGE */}
        {page === 'features' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">All Features</h1>
              <p className="mt-3 text-white/80 max-w-2xl">Complete feature comparison across all plans.</p>

              <div className="mt-12 space-y-8">
                {/* Basic Tier */}
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-indigo-300 text-2xl">Basic - $5/mo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-3 text-sm text-white/80">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Core typing engine</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> 10 saved presets</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Email support</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Basic spell check</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Grammar suggestions</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Word counter</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Pro Tier */}
                <Card className="bg-white/10 border-white/20 ring-2 ring-indigo-400">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-indigo-300 text-2xl">Pro - $15/mo</CardTitle>
                      <span className="rounded-full bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5">Most popular</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-3 text-sm text-white/80">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> All Basic features</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Unlimited presets</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Stealth mode</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Custom hotkeys</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Priority support</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Advanced AI writing assistant</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Citation generator</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Plagiarism checker</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Premium Tier */}
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-indigo-300 text-2xl">Premium - $29/mo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-3 text-sm text-white/80">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> All Pro features</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Priority support 24/7</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Advanced customization</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Team collaboration tools</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> API access</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Custom AI training</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> Dedicated account manager</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-indigo-400 flex-shrink-0" /> White-label options</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 text-center">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-400" onClick={() => setPage('pricing')}>
                  Choose Your Plan
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Global footer - renders after all pages */}
        {page === 'community' && (
          <footer className="relative z-10 border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-white/60 grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
                  <div className="h-6 w-6 rounded-md bg-black grid place-items-center ring-1 ring-purple-500/40 shadow-[0_0_18px_rgba(168,85,247,.35)]" />
                  <span>Ovara</span>
                </div>
                <p className="mt-3 max-w-md">Built for writing faster and smarter.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="font-semibold text-white/80">Product</div>
                  <ul className="mt-2 space-y-1">
                    <li><button className="hover:text-white" onClick={() => setPage('download')}>Download</button></li>
                    <li><button className="hover:text-white" onClick={()=>setPage('docs')}>Changelog</button></li>
                    <li><a className="hover:text-white">Status</a></li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-white/80">Resources</div>
                  <ul className="mt-2 space-y-1">
                    <li><button className="hover:text-white" onClick={()=>setPage('docs')}>Updates</button></li>
                    <li><button className="hover:text-white" onClick={()=>setPage('community')}>Community</button></li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-white/80">Company</div>
                  <ul className="mt-2 space-y-1">
                    <li><a className="hover:text-white">Terms</a></li>
                    <li><a className="hover:text-white">Privacy</a></li>
                    <li><button className="hover:text-white" onClick={()=>setPage('community')}>Discord server</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        )}
        {!(page==='control' || page==='community') && (
          <footer className="relative z-10 border-t border-white/10 flex-shrink-0 mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-white/60 grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
                  <div className="h-6 w-6 rounded-md bg-black grid place-items-center ring-1 ring-purple-500/40 shadow-[0_0_18px_rgba(168,85,247,.35)]" />
                  <span>Ovara</span>
                </div>
                <p className="mt-3 max-w-md">Built for writing faster and smarter.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="font-semibold text-white/80">Product</div>
                  <ul className="mt-2 space-y-1">
                    <li><button className="hover:text-white" onClick={() => setPage('download')}>Download</button></li>
                    <li><button className="hover:text-white" onClick={()=>setPage('docs')}>Changelog</button></li>
                    <li><a className="hover:text-white">Status</a></li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-white/80">Resources</div>
                  <ul className="mt-2 space-y-1">
                    <li><button className="hover:text-white" onClick={()=>setPage('docs')}>Updates</button></li>
                    <li><button className="hover:text-white" onClick={()=>setPage('community')}>Community</button></li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-white/80">Company</div>
                  <ul className="mt-2 space-y-1">
                    <li><a className="hover:text-white">Terms</a></li>
                    <li><a className="hover:text-white">Privacy</a></li>
                    <li><button className="hover:text-white" onClick={()=>setPage('community')}>Discord server</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        )}
        </div>

        {/* User Dropdown Menu - Fixed positioned outside normal flow */}
        {menuOpen && user && (
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="fixed top-[4.5rem] w-56 rounded-xl border border-white/10 bg-[#0b0c10] shadow-[0_0_30px_rgba(99,102,241,.5)] z-[9999]"
              style={{ backdropFilter: 'blur(12px)', right: 'max(1rem, calc((100vw - 1280px) / 2 + 1rem))' }}
            >
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={()=>{setPage('home'); setMenuOpen(false);}}
                >Home</button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={()=>{setPage('control'); setMenuOpen(false);}}
                >Control Panel</button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={()=>{setPage('community'); setMenuOpen(false);}}
                >Community</button>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                  onClick={()=>{setPage('settings'); setMenuOpen(false);}}
                >Settings</button>
                {userSubscription?.tier !== 'premium' && (
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-indigo-300 hover:bg-white/10 transition-colors font-medium"
                    onClick={()=>{setPage('pricing'); setMenuOpen(false);}}
                  >
                    Upgrade
                  </button>
                )}
                {isAdmin && (
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-purple-300 hover:bg-white/10 transition-colors font-medium"
                    onClick={()=>{setPage('admin'); setMenuOpen(false);}}
                  >
                    ⚡ Admin
                  </button>
                )}
                <button
                  className="w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/10 transition-colors"
                  onClick={async ()=>{
                    await supabase.auth.signOut();
                    setUser(null);
                    setMenuOpen(false);
                    setPage('home');
                    showToast('Signed out');
                  }}
                >Sign out</button>
              </div>
            </div>
          </>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md px-4 py-3 text-sm shadow-[0_0_35px_rgba(99,102,241,.45)]">
            {toast}
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}
