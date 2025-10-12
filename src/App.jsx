import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, LogOut, Settings, Users, PanelLeft, Sparkles, Brain, FileText, ArrowUpRight } from "lucide-react";

/* ---------- tiny UI helpers ---------- */
const cx = (...a) => a.filter(Boolean).join(" ");
const NavItem = ({ icon: Icon, label, active, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
      active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white",
      className
    )}
  >
    {Icon && <Icon size={16} className="shrink-0" />}
    <span className="truncate">{label}</span>
  </button>
);

const SectionTitle = ({ children }) => (
  <div className="px-3 pt-4 pb-2 text-[11px] tracking-wide uppercase text-white/40">{children}</div>
);

/* ---------- fake data placeholders ---------- */
const demoEmail = "hopla07@outlook.com";
const demoSaved = {
  aiGenerated: [
    { id: "a1", title: "Rhetorical Analysis – Draft", words: 742 },
    { id: "a2", title: "PathwayU Reflection", words: 518 },
  ],
  humanized: [
    { id: "h1", title: "Hip-Hop Feminism Short", words: 603 },
  ],
};

/* ---------- simple analyzers for AI Detector ---------- */
const AI_WORDS = [
  "moreover","furthermore","additionally","in conclusion","thus","hence","delve","paradigm",
  "realm","notably","intricate","ameliorate","underscores","comprehensive","crucial","pivotal"
];

function analyzeText(txt) {
  const words = txt.trim().split(/\s+/).filter(Boolean);
  const sentences = txt.split(/(?<=[.!?])\s+/);
  const aiHits = AI_WORDS.reduce((cnt, w) => cnt + (txt.toLowerCase().includes(w) ? 1 : 0), 0);
  const avgLen = sentences.length ? words.length / sentences.length : 0;
  const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
  const internalDupes = sentences.length - uniqueSentences.size;
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLen: Number(avgLen.toFixed(1)),
    aiPhraseMatches: aiHits,
    repeatedSentences: internalDupes
  };
}

/* ---------- main app ---------- */
export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | saved-ai | saved-human | humanizer | detector | writer
  const [savedOpen, setSavedOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // AI Detector state
  const [detectInput, setDetectInput] = useState("");
  const detectResult = useMemo(() => analyzeText(detectInput || ""), [detectInput]);

  // Humanizer state (skeleton)
  const [humanText, setHumanText] = useState("");
  const [humanizeLevel, setHumanizeLevel] = useState(60);
  const runHumanize = () => {
    // very light placeholder – swaps a few AI-ish words and shortens some sentences
    const replacements = {
      moreover: "also",
      furthermore: "also",
      additionally: "also",
      "in conclusion": "overall",
      thus: "so",
      hence: "so",
      paradigm: "model",
      underscores: "shows"
    };
    let out = humanText;
    Object.entries(replacements).forEach(([k, v]) => {
      out = out.replace(new RegExp(`\\b${k}\\b`, "gi"), v);
    });
    // Break long sentences a bit
    out = out.split(/(?<=[.!?])\s+/).map(s => (s.length > 160 - humanizeLevel ? s.replace(/, /, ". ") : s)).join(" ");
    setHumanText(out);
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0c10]/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-white/10 grid place-items-center text-white/90">O</div>
            <div className="text-sm text-white/60">Ovara</div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-white/10"
            >
              <div className="h-6 w-6 rounded-full bg-white/10 grid place-items-center">👤</div>
              <span className="hidden sm:inline text-white/80">{demoEmail}</span>
              <ChevronDown size={16} className={cx("transition", menuOpen && "rotate-180")} />
            </button>

            {/* Dropdown menu – pointer events enabled & above everything */}
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-[#0c0d12] p-1 shadow-xl z-50"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <MenuItem icon={PanelLeft} label="Control Panel" onClick={() => { setView("dashboard"); setMenuOpen(false); }} />
                <MenuItem icon={Users} label="Community" onClick={() => { window.open("https://discord.gg/your-code", "_blank"); }} />
                <MenuItem icon={Settings} label="Settings" onClick={() => { setMenuOpen(false); /* route later */ }} />
                {/* UPGRADE */}
                <MenuItem
                  icon={ArrowUpRight}
                  label="Upgrade"
                  className="text-emerald-300 hover:text-emerald-200"
                  onClick={() => { setMenuOpen(false); window.location.href = "/pricing"; }}
                />
                <div className="my-1 h-px bg-white/10" />
                <MenuItem icon={LogOut} label="Sign out" className="text-red-300 hover:text-red-200" onClick={() => { /* signout */ }} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-4 py-6">
        {/* Sidebar – full height */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <div className="sticky top-16 rounded-xl border border-white/10 bg-[#0c0d12] p-3 min-h-[calc(100vh-6rem)]">
            <SectionTitle>Saved</SectionTitle>

            {/* Saved essays (collapsible) */}
            <button
              type="button"
              onClick={() => setSavedOpen(o => !o)}
              className={cx(
                "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm",
                "text-white/80 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="flex items-center gap-2">
                <FileText size={16} className="shrink-0" />
                Saved essays
              </span>
              {savedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {savedOpen && (
              <div className="ml-6 mt-1 space-y-1">
                <NavItem
                  label="AI-generated"
                  active={view === "saved-ai"}
                  onClick={() => setView("saved-ai")}
                />
                <NavItem
                  label="Humanized essays"
                  active={view === "saved-human"}
                  onClick={() => setView("saved-human")}
                />
              </div>
            )}

            <SectionTitle>Features</SectionTitle>
            <NavItem icon={Sparkles} label="Humanizer" active={view === "humanizer"} onClick={() => setView("humanizer")} />
            <NavItem icon={Brain} label="AI detector" active={view === "detector"} onClick={() => setView("detector")} />
            <NavItem icon={FileText} label="Essay writer" active={view === "writer"} onClick={() => setView("writer")} />
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 lg:col-span-9">
          {view === "dashboard" && <Dashboard />}
          {view === "saved-ai" && <SavedList title="AI-generated" items={demoSaved.aiGenerated} />}
          {view === "saved-human" && <SavedList title="Humanized essays" items={demoSaved.humanized} />}
          {view === "humanizer" && (
            <Card title="Humanizer">
              <p className="text-white/70 mb-3">Paste text and tweak the slider. We’ll keep refining this logic.</p>
              <textarea
                value={humanText}
                onChange={e => setHumanText(e.target.value)}
                placeholder="Paste your text…"
                className="w-full h-56 rounded-lg bg-black/30 border border-white/10 p-3 outline-none"
              />
              <div className="mt-3 flex items-center gap-4">
                <label className="text-sm text-white/60">Humanize level</label>
                <input type="range" min={0} max={100} value={humanizeLevel} onChange={e => setHumanizeLevel(+e.target.value)} />
                <span className="text-sm text-white/70">{humanizeLevel}</span>
                <button
                  onClick={runHumanize}
                  className="ml-auto rounded-md bg-emerald-500/90 px-4 py-2 text-sm hover:bg-emerald-400"
                >
                  Humanize
                </button>
              </div>
            </Card>
          )}
          {view === "detector" && (
            <Card title="AI detector">
              <p className="text-white/70 mb-3">Paste an essay and click Scan. This rough pass flags AI-ish phrasing and internal duplicates.</p>
              <textarea
                value={detectInput}
                onChange={e => setDetectInput(e.target.value)}
                placeholder="Paste text…"
                className="w-full h-56 rounded-lg bg-black/30 border border-white/10 p-3 outline-none"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => setDetectInput((t) => t)}
                  className="rounded-md bg-indigo-500/90 px-4 py-2 text-sm hover:bg-indigo-400"
                >
                  Scan
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Stat label="Words" value={detectResult.wordCount} />
                <Stat label="Sentences" value={detectResult.sentenceCount} />
                <Stat label="Avg sentence length" value={detectResult.avgSentenceLen} />
                <Stat label="AI phrase matches" value={detectResult.aiPhraseMatches} />
                <Stat label="Repeated sentences" value={detectResult.repeatedSentences} />
              </div>
              <div className="mt-3 text-xs text-white/50">
                Note: This is a lightweight, offline heuristic. For plagiarism across the web, we’ll add a server check later.
              </div>
            </Card>
          )}
          {view === "writer" && (
            <Card title="Essay writer">
              <p className="text-white/70 mb-3">
                Start with your prompt; we’ll scaffold an outline and sections you can edit. (This is the basic scaffold—next we’ll wire generation.)
              </p>
              <input
                type="text"
                placeholder="Topic or assignment prompt…"
                className="w-full rounded-lg bg-black/30 border border-white/10 p-3 outline-none"
              />
              <div className="mt-3 grid gap-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="text-sm font-medium mb-1">Outline</div>
                  <ul className="list-disc pl-5 text-white/80 text-sm space-y-1">
                    <li>Hook + context</li>
                    <li>Thesis</li>
                    <li>Body 1 (evidence + analysis)</li>
                    <li>Body 2 (counterpoint)</li>
                    <li>Conclusion (so what?)</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */
const MenuItem = ({ icon: Icon, label, onClick, className }) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white text-left",
      "cursor-pointer",
      className
    )}
  >
    {Icon && <Icon size={16} className="shrink-0" />}
    <span>{label}</span>
  </button>
);

const Card = ({ title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
    <div className="mb-3 text-lg font-semibold">{title}</div>
    {children}
  </div>
);

const Stat = ({ label, value }) => (
  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
    <div className="text-white/50 text-xs">{label}</div>
    <div className="text-white/90 text-base">{String(value)}</div>
  </div>
);

const Dashboard = () => (
  <Card title="Ovara Tool">
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="text-white/90 font-medium mb-1">Welcome, {demoEmail}</div>
      <div className="text-white/60 text-sm">
        This is your hub. We’ll wire these sections to the extension next: Saved essays, Humanizer, AI detector, Essay writer.
      </div>
    </div>
  </Card>
);

const SavedList = ({ title, items }) => (
  <Card title={title}>
    {items.length === 0 ? (
      <div className="text-sm text-white/60">No items yet.</div>
    ) : (
      <ul className="divide-y divide-white/10">
        {items.map((x) => (
          <li key={x.id} className="flex items-center justify-between py-2">
            <div className="min-w-0">
              <div className="truncate">{x.title}</div>
              <div className="text-xs text-white/50">{x.words} words</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-white/10 px-3 py-1 text-xs hover:bg-white/5">Open</button>
              <button className="rounded-md border border-white/10 px-3 py-1 text-xs hover:bg-white/5">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
