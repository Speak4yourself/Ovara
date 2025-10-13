import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, Shield, Zap, LogIn, Star, Github } from 'lucide-react'

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
  const [yearly, setYearly] = useState(true)
  const showcaseRef = useRef(null)

  // auth + ui state
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2600); };

  // Docs/Updates entries
  const updates = [
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
    { name: "Team", priceM: 29, priceY: 276, cta: "Start Team", highlights: ["Seat management", "Central billing", "Shared presets"], popular: false },
  ];

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

  return (
    <>
      <style>{`
        @keyframes softPulse { 0%, 100% { box-shadow: 0 0 35px rgba(99,102,241,.35); } 50% { box-shadow: 0 0 55px rgba(99,102,241,.6); } }
        .pulse-glow { animation: softPulse 2.8s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-[#0b0c10] text-white">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/2 h-72 w-[56rem] -translate-x-1/2 rounded-full blur-3xl opacity-30"
               style={{ background: "radial-gradient(closest-side, rgba(130,87,229,.6), rgba(0,0,0,0))" }} />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[48rem] -translate-x-1/3 rounded-full blur-3xl opacity-25"
               style={{ background: "radial-gradient(closest-side, rgba(37,99,235,.55), rgba(0,0,0,0))" }} />
        </div>

        {/* Header (hidden on control page) */}
        <header className={`relative z-10 ${page==='control' ? 'hidden' : ''}`}>
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
            <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
              <button className="hover:text-white transition" onClick={() => setPage('home')}>Home</button>
              <a className="hover:text-white transition" href="#features" onClick={(e)=>{e.preventDefault(); document.getElementById('features')?.scrollIntoView({behavior:'smooth'});}}>Features</a>
              <button className="hover:text-white transition" onClick={() => setPage('docs')}>Docs</button>
            </nav>
            <div className="flex items-center gap-3 relative">
              {!user ? (<>
                <Button variant="ghost" className="text-white/80 hover:text-white" onClick={() => setPage('login')}>Log in</Button>
                <Button className="bg-indigo-500 hover:bg-indigo-400" onClick={() => setPage('download')}>Download</Button>
              </>) : (
                <div className="relative">
                  <button onClick={()=>setMenuOpen(!menuOpen)} className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"/> {user.email?.split('@')[0] || 'User'}
                    <svg width="16" height="16" viewBox="0 0 20 20" className="opacity-80"><path fill="currentColor" d="M5 7l5 6 5-6z"/></svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0b0c10] shadow-[0_0_22px_rgba(99,102,241,.35)] z-50">
                      <button className="block w-full text-left px-4 py-3 text-sm hover:bg-white/5 cursor-pointer" onClick={()=>{setPage('control'); setMenuOpen(false);}}>Control Panel</button>
                      <button className="block w-full text-left px-4 py-3 text-sm hover:bg-white/5 cursor-pointer" onClick={()=>{setPage('community'); setMenuOpen(false);}}>Community</button>
                      <button className="block w-full text-left px-4 py-3 text-sm hover:bg-white/5 cursor-pointer" onClick={()=>{setPage('settings'); setMenuOpen(false);}}>Settings</button>
                      <button className="block w-full text-left px-4 py-3 text-sm text-indigo-300 hover:bg-white/5 cursor-pointer font-medium" onClick={()=>{setPage('pricing'); setMenuOpen(false);}}>Upgrade to Pro</button>
                      <button className="block w-full text-left px-4 py-3 text-sm text-red-300 hover:bg-white/5 cursor-pointer" onClick={()=>{setUser(null); setMenuOpen(false); showToast('Signed out');}}>Sign out</button>
                    </div>
                  )}
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
                Ovara — <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">The Writing Tool</span>
              </h1>
              <p className="mt-5 max-w-2xl text-white/90 text-lg">Ease homework. Draft faster. Tighter focus for essays and research.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-indigo-500 hover:bg-indigo-400" onClick={() => setPage('download')}> 
                  Download Now <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-white/90" onClick={gotoShowcase}>
                  See in Action
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <Github className="mr-1.5 h-4 w-4" /> Source
                </Button>
              </div>

              {/* Stats styled like download cards */}
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {[
                  { k: ">6M", v: "Downloads" },
                  { k: "200+", v: "Modules" },
                  { k: "50+", v: "Commands" },
                  { k: "100k+", v: "Lines of code" },
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
                {tiers.map((t) => (
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
                      <ul className="mt-4 space-y-2 text-sm text-indigo-100/90">
                        {t.highlights.map((h) => (<li key={h} className="flex items-center gap-2"><Check className="h-4 w-4" /> {h}</li>))}
                      </ul>
                      <Button className="mt-6 w-full bg-indigo-500 hover:bg-indigo-400">{t.cta}</Button>
                    </CardContent>
                  </Card>
                ))}
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

        {/* LOGIN PAGE */}
        {page === 'login' && (
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold">Account</h1>
              <p className="text-white/70 mt-1 text-sm">Log in or create an account to continue. New? Create an account below — we'll capture your email automatically.</p>
              <Card className="mt-6 bg-white/5 border-white/10">
                <CardContent className="pt-6">
                  {/* Login */}
                  <form className="space-y-3" onSubmit={(e)=>{e.preventDefault(); const email=(e.currentTarget.querySelector('input[placeholder="you@example.com"]')||{}).value||'user@ovara.app'; setUser({email}); setPage('home'); showToast('Welcome back'); }}>
                    <div>
                      <label className="block text-sm text-white/70">Email</label>
                      <input className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70">Password</label>
                      <input type="password" className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" placeholder="••••••••" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" className="accent-indigo-500"/> Keep me signed in</label>
                      <a className="text-xs text-indigo-300 hover:text-indigo-200">Forgot password?</a>
                    </div>
                    <Button className="w-full bg-indigo-500 hover:bg-indigo-400" type="submit">Sign in</Button>
                  </form>

                  {/* Sign up captures email */}
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <h2 className="text-lg font-semibold">Create an account</h2>
                    <form className="mt-3 space-y-3" onSubmit={(e)=>{e.preventDefault(); const el = document.getElementById('signup-email'); const email = (el && el.value) || ''; try { const list = JSON.parse(localStorage.getItem('ovara_users')||'[]'); list.push({ email, createdAt: Date.now() }); localStorage.setItem('ovara_users', JSON.stringify(list)); const wl = JSON.parse(localStorage.getItem('ovara_waitlist')||'[]'); wl.push({ email, from:'signup', createdAt: Date.now() }); localStorage.setItem('ovara_waitlist', JSON.stringify(wl)); } catch(_){} showToast('Account created — please log in'); setPage('login'); }}>
                      <div>
                        <label className="block text-sm text-white/70">Email</label>
                        <input id="signup-email" className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" placeholder="you@example.com" required />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70">Password</label>
                        <input type="password" className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 outline-none focus:border-indigo-400" placeholder="Create a password" required />
                      </div>
                      <Button className="w-full bg-indigo-500 hover:bg-indigo-400" type="submit">Create account</Button>
                      <p className="text-xs text-white/60 mt-2">By signing up, you agree to our Terms and Privacy.</p>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Community Page */}
        {page === 'community' && (
          <>
            <section className="relative z-10 py-16">
              <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
                <Card className="bg-white/10 border-white/20 backdrop-blur-md shadow-[0_0_35px_rgba(99,102,241,.45)]">
                  <CardHeader>
                    <CardTitle className="text-indigo-200 text-2xl">Join the Ovara Community</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm">Hop into our Discord to get updates, report issues, and meet other users. Click below to join.</p>
                    <Button className="mt-4 w-full" onClick={()=>{ const url = localStorage.getItem('ovara_discord_url') || '#'; if(url==='#'){ showToast('Set ovara_discord_url in localStorage to enable'); } else { window.open(url, '_blank'); } }}>Open Discord</Button>
                    <p className="text-xs text-white/50 mt-3">We’ll replace this with your real invite once you share it.</p>
                  </CardContent>
                </Card>
              </div>
            </section>
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
          </>
        )}

        {/* Hide global footer on control/community */}
        {!(page==='control' || page==='community') && (
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

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md px-4 py-3 text-sm shadow-[0_0_35px_rgba(99,102,241,.45)]">
            {toast}
          </div>
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
          <section className="relative z-10 py-16">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold">Settings</h1>
              
              {/* Account Settings */}
              <div className="mt-8 space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="Enter your full name"
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <Button variant="outline" className="mt-2">Update Profile</Button>
                  </CardContent>
                </Card>

                {/* Security */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">New Password</label>
                      <input 
                        type="password" 
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400"
                      />
                    </div>
                    <Button variant="outline" className="mt-2">Change Password</Button>
                  </CardContent>
                </Card>

                {/* Preferences */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Email Notifications</div>
                        <div className="text-sm text-white/60">Receive updates about your account</div>
                      </div>
                      <button onClick={() => {}} className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Dark Mode</div>
                        <div className="text-sm text-white/60">Toggle application theme</div>
                      </div>
                      <button onClick={() => {}} className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                      </button>
                    </div>
                    <div className="pt-2">
                      <label className="block text-sm text-white/70 mb-1">Language</label>
                      <select className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-white outline-none focus:border-indigo-400">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Current Plan: <span className="text-indigo-400">Basic</span></div>
                        <div className="text-sm text-white/60">You are currently on the Basic plan</div>
                      </div>
                      <Button onClick={() => setPage('pricing')}>Upgrade Plan</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-red-400">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/70 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                    <Button 
                      variant="outline" 
                      className="border-red-500/50 text-red-400 hover:bg-red-950/30"
                      onClick={() => {
                        if(confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          setUser(null);
                          setPage('home');
                          showToast('Account deleted successfully');
                        }
                      }}
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* CONTROL PANEL */}
        {page === 'control' && (
          <section className="relative z-10 py-0">
            <div className="grid grid-cols-[260px_1fr] min-h-[80vh]">
              {/* Sidebar */}
              <div className="border-r border-white/10 bg-white/5">
                <div className="p-4 flex items-center gap-2 cursor-pointer" onClick={()=>setPage('home')}>
                  <div className="h-8 w-8 rounded-md bg-black ring-1 ring-purple-500/40" />
                  <div className="font-semibold">Ovara</div>
                </div>
                <div className="px-3 pb-6 space-y-1">
                  <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/50">Saved</div>
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10">Saved essays</button>
                  <div className="px-3 pt-4 pb-2 text-xs uppercase tracking-wide text-white/50">Features</div>
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10">Humanizer</button>
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10">AI detector</button>
                  <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white/10">Essay writer</button>
                </div>
              </div>
              {/* Main */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Ovara Tool</h2>
                </div>
                <div className="mt-6 grid gap-4">
                  <Card className="bg:white/5 border-white/10">
                    <CardHeader><CardTitle>Welcome, {user?.email || 'user'}</CardTitle></CardHeader>
                    <CardContent><p className="text-white/70 text-sm">This is your hub. We’ll wire these sections to the extension next: Saved essays, Humanizer, AI detector, Essay writer.</p></CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
