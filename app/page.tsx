"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCurrent } from "@/lib/storage";
import { useTheme } from "@/components/ThemeProvider";
import LandingCardStack from "@/components/LandingCardStack";
import type { StorySet } from "@/lib/types";

// ─── Loading screen ───────────────────────────────────────────────────────────

const STATUS = ["Reading the source…", "Identifying key ideas…", "Crafting your story cards…", "Almost there…"];

function LoadingScreen() {
  const [mi, setMi] = useState(0);
  useEffect(() => {
    const intervals = [3000, 4000, 5000];
    let step = 0;
    function tick() { step++; setMi(Math.min(step, STATUS.length - 1)); if (step < STATUS.length - 1) setTimeout(tick, intervals[step] ?? 4000); }
    const t = setTimeout(tick, intervals[0]);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <p style={{ textAlign: "center", color: "var(--lp-text)", fontSize: 14, fontWeight: 600, marginBottom: 32, height: 20 }}>{STATUS[mi]}</p>
        {[1, 0.6, 0.3].map((op, i) => (
          <div key={i} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 20, marginBottom: 12, opacity: op }}>
            <div style={{ height: 10, background: "var(--lp-surface2)", borderRadius: 999, width: "30%", marginBottom: 16 }} />
            <div style={{ height: 18, background: "var(--lp-border)", borderRadius: 8, width: "70%", marginBottom: 8 }} />
            <div style={{ height: 18, background: "var(--lp-border)", borderRadius: 8, width: "50%", marginBottom: 20 }} />
            {[1, 0.8, 0.6].map((w, j) => <div key={j} style={{ height: 11, background: "var(--lp-surface2)", borderRadius: 6, width: `${w * 100}%`, marginBottom: 8 }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inner page (needs searchParams) ─────────────────────────────────────────

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle: toggleTheme } = useTheme();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardIdx, setCardIdx] = useState(0);
  const [cardSaved, setCardSaved] = useState(0);
  const autoTriggered = useRef(false);

  const generate = useCallback(async (targetUrl: string) => {
    setError("");
    setLoading(true);
    try {
      const parseRes = await fetch("/api/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: targetUrl }) });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error ?? "Parse failed");

      const storiesRes = await fetch("/api/stories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parseData) });
      const storiesText = await storiesRes.text();
      let storiesData: Record<string, unknown>;
      try { storiesData = JSON.parse(storiesText); } catch { throw new Error(`Server error (${storiesRes.status})`); }
      if (!storiesRes.ok) throw new Error((storiesData.error as string) ?? "Generation failed");

      const storySet: StorySet = {
        id: crypto.randomUUID(),
        title: storiesData.title as string,
        source: storiesData.source as string,
        sourceUrl: storiesData.sourceUrl as string | undefined,
        cards: storiesData.cards as StorySet["cards"],
        savedAt: new Date().toISOString(),
      };
      saveCurrent(storySet);
      router.push("/stories");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const u = searchParams.get("url");
    if (u && !autoTriggered.current) { autoTriggered.current = true; setUrl(u); generate(u); }
  }, [searchParams, generate]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (url.trim()) generate(url.trim()); };

  if (loading) return <LoadingScreen />;

  const T = { fontFamily: "'Space Grotesk', sans-serif" };

  // SVG icons
  const IconSun = () => <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4.2} /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" /></svg>;
  const IconMoon = () => <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", color: "var(--lp-text)", overflowX: "hidden", position: "relative" }}>

      {/* Background glow */}
      <div aria-hidden style={{ position: "absolute", top: -180, left: "50%", transform: "translateX(-50%)", width: 900, height: 520, borderRadius: "50%", background: "radial-gradient(closest-side,var(--lp-glow),transparent)", filter: "blur(30px)", opacity: 0.7, pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "color-mix(in srgb, var(--lp-bg) 72%, transparent)", borderBottom: "1px solid var(--lp-border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ display: "inline-flex", width: 34, height: 34, borderRadius: 10, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px -6px var(--lp-glow)" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} /><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...T, fontWeight: 700, fontSize: 21, letterSpacing: "-0.01em" }}>Storis</span>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 14.5, fontWeight: 500, color: "var(--lp-text2)" }}>
            <a href="#how" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
            <a href="#explore" style={{ color: "inherit", textDecoration: "none" }}>Explore</a>
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>Features</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={toggleTheme} aria-label="Toggle theme" style={{ width: 40, height: 40, borderRadius: 11, border: "1px solid var(--lp-border)", background: "var(--lp-surface)", color: "var(--lp-text)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            <button onClick={() => document.getElementById("hero-input")?.focus()} style={{ padding: "10px 18px", borderRadius: 11, border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 14.5, cursor: "pointer", boxShadow: "0 8px 22px -8px var(--lp-glow)" }}>Try it now</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "72px 28px 64px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
          {/* Copy */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: 540, minWidth: 280 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 15px", borderRadius: 999, border: "1px solid var(--lp-border)", background: "var(--lp-surface2)", color: "var(--lp-text2)", fontSize: 12.5, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--lp-accent)", boxShadow: "0 0 0 4px var(--lp-glow)" }} />
              Tinder — but for reading
            </div>
            <h1 style={{ ...T, fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", fontSize: "clamp(44px,6.6vw,82px)", margin: 0, color: "var(--lp-text)" }}>
              The whole story,<br />in seven swipes.
            </h1>
            <p style={{ fontSize: "clamp(16px,1.5vw,20px)", lineHeight: 1.55, color: "var(--lp-text2)", margin: "20px 0 0", maxWidth: "42ch" }}>
              Paste a link. Storis distills it into bite-size cards you swipe through — a feed that actually makes you smarter.
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, width: "100%", maxWidth: 480, marginTop: 30 }}>
              <input
                id="hero-input"
                type="url"
                placeholder="Paste a link to any article…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{ flex: 1, minWidth: 0, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius)", padding: "14px 16px", color: "var(--lp-text)", fontSize: 15, fontFamily: "inherit", outline: "none" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--lp-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--lp-border)")}
              />
              <button type="submit" style={{ whiteSpace: "nowrap", padding: "14px 22px", borderRadius: "var(--lp-radius)", border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 10px 28px -8px var(--lp-glow)" }}>
                Try it now
              </button>
            </form>
            {error && <p style={{ marginTop: 12, fontSize: 14, color: "var(--lp-skip)", background: "color-mix(in srgb, var(--lp-skip) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--lp-skip) 30%, transparent)", borderRadius: "var(--lp-radius)", padding: "10px 14px", width: "100%", maxWidth: 480 }}>{error}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 16, fontSize: 13, color: "var(--lp-text3)" }}>
              <span style={{ fontWeight: 600 }}>Works with</span>
              {["Articles", "Newsletters", "PDFs", "Threads"].map((l) => (
                <span key={l} style={{ padding: "4px 10px", borderRadius: 999, background: "var(--lp-surface2)", border: "1px solid var(--lp-border)" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Card stack */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div style={{ width: 360, maxWidth: "84vw", height: 472, animation: "floatY 7s ease-in-out infinite" }}>
              <LandingCardStack onProgress={(i, s) => { setCardIdx(i); setCardSaved(s); }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "var(--lp-text3)", fontWeight: 600 }}>
              <span><span style={{ color: "var(--lp-skip)" }}>←</span> less</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>tap: next</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>save <span style={{ color: "var(--lp-save)" }}>→</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--lp-text2)" }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{cardIdx + 1} / {7}</span>
              <span style={{ width: 1, height: 12, background: "var(--lp-border)" }} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--lp-save)", fontWeight: 700 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
                {cardSaved} saved
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section id="how" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "64px 28px" }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 14 }}>How it works</div>
          <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0, color: "var(--lp-text)" }}>From link to learned in three taps.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
          {[
            { n: "01", title: "Paste anything", body: "Drop in a URL, a PDF, or a block of text. No account, no setup." },
            { n: "02", title: "AI makes the cards", body: "We distill it into 5–7 swipeable cards — the key ideas, none of the filler." },
            { n: "03", title: "Swipe to read", body: "Right to save, left for less, tap for the next. A full read in a single minute." },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 30 }}>
              <div style={{ ...T, fontWeight: 700, fontSize: 15, width: 38, height: 38, borderRadius: 11, background: "var(--lp-surface2)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--lp-border)" }}>{n}</div>
              <h3 style={{ ...T, fontWeight: 600, fontSize: 21, margin: "20px 0 8px", letterSpacing: "-0.01em" }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--lp-text2)", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section id="features" style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "48px 28px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gridAutoRows: "minmax(0,1fr)", gap: 20 }}>
          {/* Big feature */}
          <div style={{ gridRow: "span 2", background: "var(--lp-bg2)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 32, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 300, overflow: "hidden", position: "relative" }}>
            <div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--lp-accent)", color: "var(--lp-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px -8px var(--lp-glow)" }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
              </div>
              <h3 style={{ ...T, fontWeight: 700, fontSize: 26, margin: "22px 0 10px", letterSpacing: "-0.02em" }}>Made for swiping</h3>
              <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--lp-text2)", margin: 0, maxWidth: "34ch" }}>Buttery card gestures with real physics. Right saves it, left shows you less of that topic, tap moves on. It's reading that feels like a feed.</p>
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 26 }}>
              <span style={{ flex: 1, height: 80, borderRadius: 14, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", transform: "rotate(-5deg)", display: "block" }} />
              <span style={{ flex: 1, height: 80, borderRadius: 14, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", display: "block" }} />
              <span style={{ flex: 1, height: 80, borderRadius: 14, background: "var(--lp-accent)", opacity: 0.9, transform: "rotate(5deg)", display: "block" }} />
            </div>
          </div>
          {/* Explore feed */}
          <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--lp-surface2)", border: "1px solid var(--lp-border)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
            </div>
            <h3 style={{ ...T, fontWeight: 600, fontSize: 20, margin: "18px 0 7px", letterSpacing: "-0.01em" }}>Explore feed</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--lp-text2)", margin: 0 }}>A personalized stream by topic — the more you swipe, the sharper it gets.</p>
          </div>
          {/* Streaks */}
          <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--lp-surface2)", border: "1px solid var(--lp-border)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 3c1 3.5-1.5 5-1.5 7.5A4.5 4.5 0 0 0 15 15c2.5-1 3-4 1.5-6 .5 3-1.5 3.5-1.5 1.5C14 7 12 5 12 3z" /><path d="M8.5 13c-.5 1.2-.5 2.4.3 3.4A4 4 0 0 0 16 15" /></svg>
            </div>
            <h3 style={{ ...T, fontWeight: 600, fontSize: 20, margin: "18px 0 7px", letterSpacing: "-0.01em" }}>Streaks that stick</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--lp-text2)", margin: 0 }}>Daily goals and a streak counter turn reading into a habit you keep.</p>
          </div>
          {/* Light & dark */}
          <div style={{ gridColumn: "span 2", background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 28, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ ...T, fontWeight: 600, fontSize: 20, margin: "0 0 7px", letterSpacing: "-0.01em" }}>Light &amp; dark, your way</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--lp-text2)", margin: 0 }}>Easy on the eyes day or night — Storis remembers exactly how you like to read across every session.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <span style={{ width: 54, height: 54, borderRadius: 14, background: "#FFFFFF", border: "1px solid var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#15131F" }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4} /><path d="M12 2.5v2M12 19.5v2M4.5 4.5l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2M19.5 12h2M4.5 19.5l1.5-1.5M17.9 6.1l1.5-1.5" /></svg>
              </span>
              <span style={{ width: 54, height: 54, borderRadius: 14, background: "#0B0A12", border: "1px solid var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F2F0FA" }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section id="explore" style={{ position: "relative", zIndex: 1, background: "var(--lp-bg2)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 30 }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 14 }}>Explore</div>
              <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(30px,4vw,46px)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0 }}>A feed worth coming back to.</h2>
            </div>
            <p style={{ fontSize: 15, color: "var(--lp-text2)", maxWidth: "34ch", margin: 0, lineHeight: 1.5 }}>Tap into curated decks by topic — no link required. Tuned to what you save.</p>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 26 }}>
            {["For you", "Tech", "Science", "Ideas", "Business", "Health", "Culture"].map((t, i) => (
              <span key={t} style={{ padding: "8px 16px", borderRadius: 999, background: i === 0 ? "var(--lp-accent)" : "var(--lp-surface)", border: i === 0 ? "none" : "1px solid var(--lp-border)", fontSize: 13.5, fontWeight: i === 0 ? 700 : 600, color: i === 0 ? "var(--lp-on-accent)" : "var(--lp-text2)", cursor: "pointer" }}>{t}</span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18 }}>
            {[
              { tag: "Science", time: "6 cards · 48s", title: "The quiet power of doing nothing", source: "Nautilus", saves: "2.1k" },
              { tag: "Tech",    time: "7 cards · 55s", title: "What we lost when the feed got infinite", source: "The Verge", saves: "3.4k" },
              { tag: "Ideas",   time: "5 cards · 42s", title: "Why deadlines make us more creative", source: "Aeon", saves: "1.8k" },
            ].map(({ tag, time, title, source, saves }) => (
              <div key={title} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 14, minHeight: 210, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--lp-accent)" }}>{tag}</span>
                  <span style={{ fontSize: 12, color: "var(--lp-text3)" }}>{time}</span>
                </div>
                <h3 style={{ ...T, fontWeight: 600, fontSize: 21, lineHeight: 1.18, margin: 0, letterSpacing: "-0.01em", flex: 1 }}>{title}</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--lp-border)", paddingTop: 14 }}>
                  <span style={{ fontSize: 12.5, color: "var(--lp-text2)" }}>{source}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--lp-text2)", fontWeight: 600 }}>
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
                    {saves}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Habit / Streak */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "72px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 14 }}>The habit</div>
            <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(30px,4vw,48px)", lineHeight: 1.04, letterSpacing: "-0.02em", margin: "0 0 18px" }}>Reading that earns its place in your day.</h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--lp-text2)", margin: "0 0 28px", maxWidth: "42ch" }}>A minute is easy to find. Storis keeps the streak going with daily goals, gentle nudges, and a library that quietly grows every time you swipe.</p>
            <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
              {[["~1 min", "average session"], ["7 cards", "per read"], ["Synced", "everywhere you read"]].map(([v, l]) => (
                <div key={v}>
                  <div style={{ ...T, fontWeight: 700, fontSize: 30, color: "var(--lp-text)", letterSpacing: "-0.02em" }}>{v}</div>
                  <div style={{ fontSize: 13, color: "var(--lp-text3)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Streak widget */}
          <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 30, boxShadow: "var(--lp-shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <span style={{ width: 48, height: 48, borderRadius: 14, background: "color-mix(in srgb, var(--lp-accent) 16%, transparent)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.3 4.5-2 6.4-2 9.6A4.7 4.7 0 0 0 16 16c3.2-1.3 3.8-5.2 1.9-7.7.6 3.9-2 4.5-2 1.9C15.5 7.2 13 4.6 12 2z" /></svg>
              </span>
              <div>
                <div style={{ ...T, fontWeight: 700, fontSize: 26, lineHeight: 1, letterSpacing: "-0.02em" }}>12-day streak</div>
                <div style={{ fontSize: 13, color: "var(--lp-text3)", marginTop: 4 }}>Keep it alive — read today</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 24 }}>
              {[["M", true], ["T", true], ["W", true], ["T", true], ["F", true], ["S", false], ["S", false]].map(([day, done], i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: 44, borderRadius: 11, background: done ? "var(--lp-accent)" : "var(--lp-surface2)", border: done ? "none" : "2px dashed var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lp-on-accent)" }}>
                    {done && <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>}
                  </div>
                  <div style={{ fontSize: 11, color: done ? "var(--lp-text3)" : "var(--lp-text2)", marginTop: 6, fontWeight: done ? 400 : 700 }}>{day as string}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--lp-surface2)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius)", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700 }}>Today's goal</span>
                <span style={{ fontSize: 13, color: "var(--lp-text2)", fontVariantNumeric: "tabular-nums" }}>5 / 5 cards</span>
              </div>
              <div style={{ height: 9, borderRadius: 999, background: "var(--lp-border)", overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--lp-accent), var(--lp-accent2))" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "24px 28px 84px" }}>
        <div style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-border)", borderRadius: "calc(var(--lp-radius-lg) + 6px)", padding: "clamp(36px,6vw,72px) 28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", bottom: -160, left: "50%", transform: "translateX(-50%)", width: 760, height: 420, borderRadius: "50%", background: "radial-gradient(closest-side,var(--lp-glow),transparent)", filter: "blur(20px)", opacity: 0.7, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
            <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(32px,5vw,56px)", lineHeight: 1.02, letterSpacing: "-0.025em", margin: "0 0 16px" }}>Start reading the smart way.</h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: "var(--lp-text2)", margin: "0 0 30px" }}>Paste a link and watch it turn into a deck. No sign-up to try your first read.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, maxWidth: 480, margin: "0 auto" }}>
              <input
                type="url"
                placeholder="Paste a link to any article…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                style={{ flex: 1, minWidth: 0, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius)", padding: "15px 16px", color: "var(--lp-text)", fontSize: 15, fontFamily: "inherit", outline: "none" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--lp-accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--lp-border)")}
              />
              <button type="submit" style={{ whiteSpace: "nowrap", padding: "15px 24px", borderRadius: "var(--lp-radius)", border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 12px 30px -8px var(--lp-glow)" }}>Try it now</button>
            </form>
            <p style={{ marginTop: 16, fontSize: 13, color: "var(--lp-text3)" }}>
              Or replace <code style={{ background: "var(--lp-surface)", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>https://</code> with <code style={{ background: "var(--lp-surface)", padding: "2px 6px", borderRadius: 6, fontSize: 12 }}>storis.in/</code> on any article URL.{" "}
              <a href="/install" style={{ color: "var(--lp-accent)", textDecoration: "none", fontWeight: 600 }}>Get the bookmarklet →</a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid var(--lp-border)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "36px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: 8, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...T, fontWeight: 700, fontSize: 17 }}>Storis</span>
            <span style={{ fontSize: 13, color: "var(--lp-text3)", marginLeft: 6 }}>© 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 13.5, color: "var(--lp-text2)", fontWeight: 500 }}>
            <a href="#how" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
            <a href="#explore" style={{ color: "inherit", textDecoration: "none" }}>Explore</a>
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>Features</a>
            <a href="/curate" style={{ color: "inherit", textDecoration: "none" }}>Library</a>
          </div>
        </div>
      </footer>

      <style>{`
        .nav-links { display: flex !important; }
        @media (max-width: 880px) { .nav-links { display: none !important; } }
        @media (max-width: 880px) {
          [data-features-grid] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
