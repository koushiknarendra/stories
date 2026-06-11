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
    const ivs = [3000, 4000, 5000];
    let s = 0;
    function tick() { s++; setMi(Math.min(s, STATUS.length - 1)); if (s < STATUS.length - 1) setTimeout(tick, ivs[s] ?? 4000); }
    const t = setTimeout(tick, ivs[0]);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <p style={{ textAlign: "center", color: "var(--lp-text)", fontSize: 14, fontWeight: 600, marginBottom: 28 }}>{STATUS[mi]}</p>
        {[1, 0.6, 0.3].map((op, i) => (
          <div key={i} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: 20, marginBottom: 12, opacity: op }}>
            <div style={{ height: 9, background: "var(--lp-surface2)", borderRadius: 999, width: "30%", marginBottom: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ height: 16, background: "var(--lp-border)", borderRadius: 8, width: "70%", marginBottom: 8 }} />
            <div style={{ height: 16, background: "var(--lp-border)", borderRadius: 8, width: "50%", marginBottom: 18 }} />
            {[1, 0.8, 0.6].map((w, j) => <div key={j} style={{ height: 10, background: "var(--lp-surface2)", borderRadius: 6, width: `${w * 100}%`, marginBottom: 7 }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

const IconSun = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4.2} /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" /></svg>;
const IconMoon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;

// ─── Responsive CSS ───────────────────────────────────────────────────────────

const STYLES = `
  *{box-sizing:border-box}
  .lp-nav-inner{max-width:1180px;margin:0 auto;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .lp-nav-links{display:flex;align-items:center;gap:28px;font-size:14px;font-weight:500;color:var(--lp-text2)}
  .lp-hero{max-width:1180px;margin:0 auto;padding:64px 28px 56px}
  .lp-hero-inner{display:flex;align-items:center;justify-content:space-between;gap:48px}
  .lp-hero-copy{display:flex;flex-direction:column;align-items:flex-start;flex:1;min-width:0;max-width:540px}
  .lp-hero-stage{display:flex;flex-direction:column;align-items:center;gap:16px;flex-shrink:0}
  .lp-hero-h1{font-family:'Space Grotesk',sans-serif;font-weight:700;line-height:1.0;letter-spacing:-0.03em;font-size:clamp(38px,5.5vw,78px);margin:0;color:var(--lp-text)}
  .lp-hero-form{display:flex;gap:10px;width:100%;max-width:480px;margin-top:28px}
  .lp-hero-form input{flex:1;min-width:0;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:var(--lp-radius);padding:13px 15px;color:var(--lp-text);font-size:15px;font-family:inherit;outline:none;transition:border-color .2s}
  .lp-hero-form input:focus{border-color:var(--lp-accent)}
  .lp-hero-form button{white-space:nowrap;padding:13px 20px;border-radius:var(--lp-radius);border:none;background:var(--lp-accent);color:var(--lp-on-accent);font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 10px 28px -8px var(--lp-glow);font-family:inherit}
  .lp-sec{max-width:1180px;margin:0 auto;padding:56px 28px}
  .lp-how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  .lp-feat-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:20px}
  .lp-feat-big{grid-row:span 2;min-height:260px}
  .lp-feat-wide{grid-column:span 2}
  .lp-explore-inner{max-width:1180px;margin:0 auto;padding:56px 28px}
  .lp-explore-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .lp-habit-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
  .lp-cta-form{display:flex;gap:10px;max-width:460px;margin:0 auto}
  .lp-cta-form input{flex:1;min-width:0;background:var(--lp-surface);border:1px solid var(--lp-border);border-radius:var(--lp-radius);padding:14px 15px;color:var(--lp-text);font-size:15px;font-family:inherit;outline:none;transition:border-color .2s}
  .lp-cta-form input:focus{border-color:var(--lp-accent)}
  .lp-cta-form button{white-space:nowrap;padding:14px 22px;border-radius:var(--lp-radius);border:none;background:var(--lp-accent);color:var(--lp-on-accent);font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 12px 30px -8px var(--lp-glow);font-family:inherit}
  .lp-footer-inner{max-width:1180px;margin:0 auto;padding:32px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
  .lp-footer-links{display:flex;align-items:center;gap:22px;font-size:13.5px;color:var(--lp-text2);font-weight:500;flex-wrap:wrap}

  /* ── Tablet (≤ 880px) ── */
  @media(max-width:880px){
    .lp-nav-links{display:none!important}
    .lp-hero-inner{flex-direction:column;align-items:center;text-align:center;gap:40px}
    .lp-hero-copy{align-items:center;max-width:600px}
    .lp-hero-form{max-width:100%}
    .lp-feat-grid{grid-template-columns:1fr 1fr}
    .lp-feat-big{grid-row:span 1}
    .lp-feat-wide{grid-column:span 2}
    .lp-how-grid{grid-template-columns:1fr 1fr}
    .lp-explore-grid{grid-template-columns:1fr 1fr}
    .lp-habit-grid{grid-template-columns:1fr;gap:36px}
  }

  /* ── Mobile (≤ 600px) ── */
  @media(max-width:600px){
    .lp-nav-inner{padding:12px 16px}
    .lp-nav-try{display:none}
    .lp-hero{padding:48px 16px 44px}
    .lp-hero-inner{gap:32px}
    .lp-hero-form{flex-direction:column;margin-top:22px}
    .lp-hero-form input,.lp-hero-form button{width:100%}
    .lp-sec{padding:44px 16px}
    .lp-how-grid{grid-template-columns:1fr;gap:14px}
    .lp-feat-grid{grid-template-columns:1fr;gap:14px}
    .lp-feat-wide{grid-column:span 1}
    .lp-explore-inner{padding:44px 16px}
    .lp-explore-grid{grid-template-columns:1fr;gap:14px}
    .lp-habit-grid{gap:28px}
    .lp-cta-form{flex-direction:column;max-width:100%}
    .lp-cta-form input,.lp-cta-form button{width:100%}
    .lp-footer-inner{padding:28px 16px;flex-direction:column;align-items:flex-start;gap:16px}
    .lp-footer-links{gap:16px}
    .lp-card-stage{width:min(320px,88vw)!important;height:420px!important}
  }

  /* ── Small mobile (≤ 380px) ── */
  @media(max-width:380px){
    .lp-hero-h1{font-size:32px!important}
    .lp-card-stage{height:400px!important}
  }

  @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
`;

// ─── Home (inner, uses searchParams) ─────────────────────────────────────────

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardIdx, setCardIdx] = useState(0);
  const [cardSaved, setCardSaved] = useState(0);
  const autoTriggered = useRef(false);

  const generate = useCallback(async (targetUrl: string) => {
    setError(""); setLoading(true);
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
        id: crypto.randomUUID(), title: storiesData.title as string,
        source: storiesData.source as string, sourceUrl: storiesData.sourceUrl as string | undefined,
        cards: storiesData.cards as StorySet["cards"], savedAt: new Date().toISOString(),
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", color: "var(--lp-text)", overflowX: "hidden", position: "relative" }}>
      <style>{STYLES}</style>

      {/* Glow orb */}
      <div aria-hidden style={{ position: "absolute", top: -180, left: "50%", transform: "translateX(-50%)", width: 900, height: 520, borderRadius: "50%", background: "radial-gradient(closest-side,var(--lp-glow),transparent)", filter: "blur(30px)", opacity: 0.7, pointerEvents: "none", zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "color-mix(in srgb, var(--lp-bg) 72%, transparent)", borderBottom: "1px solid var(--lp-border)" }}>
        <div className="lp-nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 32, height: 32, borderRadius: 9, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px -6px var(--lp-glow)", flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} /><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...T, fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em" }}>Storis</span>
          </div>
          <div className="lp-nav-links">
            {[["#how","How it works"],["#explore","Explore"],["#features","Features"]].map(([h,l])=>(
              <a key={h} href={h} style={{ color: "inherit", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggle} aria-label="Toggle theme" style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid var(--lp-border)", background: "var(--lp-surface)", color: "var(--lp-text)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            <button className="lp-nav-try" onClick={() => document.getElementById("hero-input")?.focus()} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 22px -8px var(--lp-glow)", whiteSpace: "nowrap" }}>
              Try it now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header style={{ position: "relative", zIndex: 1 }}>
        <div className="lp-hero">
          <div className="lp-hero-inner">
            {/* Copy */}
            <div className="lp-hero-copy">
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: "1px solid var(--lp-border)", background: "var(--lp-surface2)", color: "var(--lp-text2)", fontSize: 12, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lp-accent)", boxShadow: "0 0 0 3px var(--lp-glow)", flexShrink: 0 }} />
                Tinder — but for reading
              </div>
              <h1 className="lp-hero-h1">The whole story,<br />in seven swipes.</h1>
              <p style={{ fontSize: "clamp(15px,1.5vw,19px)", lineHeight: 1.55, color: "var(--lp-text2)", margin: "18px 0 0", maxWidth: "42ch" }}>
                Paste a link. Storis distills it into bite-size cards you swipe through — a feed that actually makes you smarter.
              </p>
              <form className="lp-hero-form" onSubmit={handleSubmit}>
                <input id="hero-input" type="url" placeholder="Paste a link to any article…" value={url} onChange={(e) => setUrl(e.target.value)} required />
                <button type="submit">Try it now</button>
              </form>
              {error && (
                <p style={{ marginTop: 10, fontSize: 13.5, color: "var(--lp-skip)", background: "color-mix(in srgb, var(--lp-skip) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--lp-skip) 25%, transparent)", borderRadius: "var(--lp-radius)", padding: "10px 14px", width: "100%", maxWidth: 480, margin: "10px 0 0" }}>
                  {error}
                </p>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 14, fontSize: 12.5, color: "var(--lp-text3)" }}>
                <span style={{ fontWeight: 600 }}>Works with</span>
                {["Articles","Newsletters","PDFs","Threads"].map((l) => (
                  <span key={l} style={{ padding: "3px 9px", borderRadius: 999, background: "var(--lp-surface2)", border: "1px solid var(--lp-border)" }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Card stage */}
            <div className="lp-hero-stage">
              <div className="lp-card-stage" style={{ width: 350, height: 460, position: "relative", animation: "floatY 7s ease-in-out infinite", flexShrink: 0 }}>
                <LandingCardStack onProgress={(i, s) => { setCardIdx(i); setCardSaved(s); }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--lp-text3)", fontWeight: 600 }}>
                <span><span style={{ color: "var(--lp-skip)" }}>←</span> less</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>tap: next</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>save <span style={{ color: "var(--lp-save)" }}>→</span></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--lp-text2)" }}>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{cardIdx + 1} / 7</span>
                <span style={{ width: 1, height: 11, background: "var(--lp-border)" }} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--lp-save)", fontWeight: 700 }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
                  {cardSaved} saved
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section id="how" style={{ position: "relative", zIndex: 1 }}>
        <div className="lp-sec">
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 44px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 12 }}>How it works</div>
            <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(26px,4vw,44px)", lineHeight: 1.06, letterSpacing: "-0.02em", margin: 0, color: "var(--lp-text)" }}>From link to learned in three taps.</h2>
          </div>
          <div className="lp-how-grid">
            {[
              { n: "01", title: "Paste anything", body: "Drop in a URL, a PDF, or a block of text. No account, no setup." },
              { n: "02", title: "AI makes the cards", body: "We distill it into 5–7 swipeable cards — the key ideas, none of the filler." },
              { n: "03", title: "Swipe to read", body: "Right to save, left for less, tap for the next. A full read in a single minute." },
            ].map(({ n, title, body }) => (
              <div key={n} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "26px 24px" }}>
                <div style={{ ...T, fontWeight: 700, fontSize: 14, width: 36, height: 36, borderRadius: 10, background: "var(--lp-surface2)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--lp-border)" }}>{n}</div>
                <h3 style={{ ...T, fontWeight: 600, fontSize: 19, margin: "18px 0 7px", letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--lp-text2)", margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" style={{ position: "relative", zIndex: 1 }}>
        <div className="lp-sec" style={{ paddingTop: 0 }}>
          <div className="lp-feat-grid">
            {/* Big swipe card */}
            <div className="lp-feat-big" style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "28px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
              <div>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--lp-accent)", color: "var(--lp-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px -8px var(--lp-glow)" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></svg>
                </div>
                <h3 style={{ ...T, fontWeight: 700, fontSize: 23, margin: "18px 0 9px", letterSpacing: "-0.02em" }}>Made for swiping</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--lp-text2)", margin: 0, maxWidth: "34ch" }}>Buttery card gestures with real physics. Right saves it, left shows less of that topic, tap moves on.</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
                <span style={{ flex: 1, height: 70, borderRadius: 12, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", transform: "rotate(-5deg)", display: "block" }} />
                <span style={{ flex: 1, height: 70, borderRadius: 12, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", display: "block" }} />
                <span style={{ flex: 1, height: 70, borderRadius: 12, background: "var(--lp-accent)", opacity: 0.9, transform: "rotate(5deg)", display: "block" }} />
              </div>
            </div>
            {/* Explore feed */}
            <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "24px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--lp-surface2)", border: "1px solid var(--lp-border)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
              </div>
              <h3 style={{ ...T, fontWeight: 600, fontSize: 18, margin: "16px 0 6px", letterSpacing: "-0.01em" }}>Explore feed</h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--lp-text2)", margin: 0 }}>A personalized stream by topic — the more you swipe, the sharper it gets.</p>
            </div>
            {/* Streaks */}
            <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "24px" }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--lp-surface2)", border: "1px solid var(--lp-border)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 3c1 3.5-1.5 5-1.5 7.5A4.5 4.5 0 0 0 15 15c2.5-1 3-4 1.5-6 .5 3-1.5 3.5-1.5 1.5C14 7 12 5 12 3z" /><path d="M8.5 13c-.5 1.2-.5 2.4.3 3.4A4 4 0 0 0 16 15" /></svg>
              </div>
              <h3 style={{ ...T, fontWeight: 600, fontSize: 18, margin: "16px 0 6px", letterSpacing: "-0.01em" }}>Streaks that stick</h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--lp-text2)", margin: 0 }}>Daily goals and a streak counter turn reading into a habit you keep.</p>
            </div>
            {/* Light & dark — spans 2 cols */}
            <div className="lp-feat-wide" style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "24px", display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ ...T, fontWeight: 600, fontSize: 18, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Light &amp; dark, your way</h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--lp-text2)", margin: 0 }}>Easy on the eyes day or night — Storis remembers how you like to read across every session.</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <span style={{ width: 48, height: 48, borderRadius: 12, background: "#FFFFFF", border: "1px solid var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#15131F" }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4} /><path d="M12 2.5v2M12 19.5v2M4.5 4.5l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2M19.5 12h2M4.5 19.5l1.5-1.5M17.9 6.1l1.5-1.5" /></svg>
                </span>
                <span style={{ width: 48, height: 48, borderRadius: 12, background: "#0B0A12", border: "1px solid var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F2F0FA" }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section id="explore" style={{ position: "relative", zIndex: 1, background: "var(--lp-bg2)", borderTop: "1px solid var(--lp-border)", borderBottom: "1px solid var(--lp-border)" }}>
        <div className="lp-explore-inner">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 12 }}>Explore</div>
              <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(26px,4vw,44px)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0 }}>A feed worth coming back to.</h2>
            </div>
            <p style={{ fontSize: 14.5, color: "var(--lp-text2)", maxWidth: "34ch", margin: 0, lineHeight: 1.5 }}>Tap into curated decks by topic — no link required.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {["For you","Tech","Science","Ideas","Business","Health","Culture"].map((t, i) => (
              <span key={t} style={{ padding: "7px 14px", borderRadius: 999, background: i === 0 ? "var(--lp-accent)" : "var(--lp-surface)", border: i === 0 ? "none" : "1px solid var(--lp-border)", fontSize: 13, fontWeight: i === 0 ? 700 : 600, color: i === 0 ? "var(--lp-on-accent)" : "var(--lp-text2)", cursor: "pointer" }}>{t}</span>
            ))}
          </div>
          <div className="lp-explore-grid">
            {[
              { tag: "Science", time: "6 cards · 48s", title: "The quiet power of doing nothing",         source: "Nautilus",  saves: "2.1k" },
              { tag: "Tech",    time: "7 cards · 55s", title: "What we lost when the feed got infinite",  source: "The Verge", saves: "3.4k" },
              { tag: "Ideas",   time: "5 cards · 42s", title: "Why deadlines make us more creative",      source: "Aeon",      saves: "1.8k" },
            ].map(({ tag, time, title, source, saves }) => (
              <div key={title} style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "22px", display: "flex", flexDirection: "column", gap: 12, minHeight: 190, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--lp-accent)" }}>{tag}</span>
                  <span style={{ fontSize: 11.5, color: "var(--lp-text3)" }}>{time}</span>
                </div>
                <h3 style={{ ...T, fontWeight: 600, fontSize: 19, lineHeight: 1.2, margin: 0, letterSpacing: "-0.01em", flex: 1 }}>{title}</h3>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--lp-border)", paddingTop: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--lp-text2)" }}>{source}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--lp-text2)", fontWeight: 600 }}>
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
                    {saves}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Habit / Streak */}
      <section style={{ position: "relative", zIndex: 1 }}>
        <div className="lp-sec">
          <div className="lp-habit-grid">
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 12 }}>The habit</div>
              <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(26px,3.5vw,46px)", lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 16px" }}>Reading that earns its place in your day.</h2>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--lp-text2)", margin: "0 0 26px", maxWidth: "42ch" }}>A minute is easy to find. Storis keeps the streak going with daily goals, gentle nudges, and a library that quietly grows.</p>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {[["~1 min","average session"],["7 cards","per read"],["Synced","everywhere"]].map(([v,l])=>(
                  <div key={v}>
                    <div style={{ ...T, fontWeight: 700, fontSize: 26, color: "var(--lp-text)", letterSpacing: "-0.02em" }}>{v}</div>
                    <div style={{ fontSize: 12, color: "var(--lp-text3)", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Streak widget */}
            <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", padding: "24px", boxShadow: "var(--lp-shadow)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span style={{ width: 44, height: 44, borderRadius: 13, background: "color-mix(in srgb, var(--lp-accent) 16%, transparent)", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1.3 4.5-2 6.4-2 9.6A4.7 4.7 0 0 0 16 16c3.2-1.3 3.8-5.2 1.9-7.7.6 3.9-2 4.5-2 1.9C15.5 7.2 13 4.6 12 2z" /></svg>
                </span>
                <div>
                  <div style={{ ...T, fontWeight: 700, fontSize: 22, lineHeight: 1, letterSpacing: "-0.02em" }}>12-day streak</div>
                  <div style={{ fontSize: 12.5, color: "var(--lp-text3)", marginTop: 3 }}>Keep it alive — read today</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 20 }}>
                {[["M",true],["T",true],["W",true],["T",true],["F",true],["S",false],["S",false]].map(([day,done],i)=>(
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: 38, borderRadius: 10, background: done ? "var(--lp-accent)" : "var(--lp-surface2)", border: done ? "none" : "2px dashed var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lp-on-accent)" }}>
                      {done && <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>}
                    </div>
                    <div style={{ fontSize: 10, color: done ? "var(--lp-text3)" : "var(--lp-text2)", marginTop: 5, fontWeight: done ? 400 : 700 }}>{day as string}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--lp-surface2)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Today's goal</span>
                  <span style={{ fontSize: 12.5, color: "var(--lp-text2)", fontVariantNumeric: "tabular-nums" }}>5 / 5 cards</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--lp-border)", overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--lp-accent), var(--lp-accent2))" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1 }}>
        <div className="lp-sec" style={{ paddingTop: 0, paddingBottom: 72 }}>
          <div style={{ background: "var(--lp-bg2)", border: "1px solid var(--lp-border)", borderRadius: "calc(var(--lp-radius-lg) + 6px)", padding: "clamp(32px,6vw,64px) clamp(16px,5vw,48px)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div aria-hidden style={{ position: "absolute", bottom: -140, left: "50%", transform: "translateX(-50%)", width: 700, height: 380, borderRadius: "50%", background: "radial-gradient(closest-side,var(--lp-glow),transparent)", filter: "blur(20px)", opacity: 0.7, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
              <h2 style={{ ...T, fontWeight: 700, fontSize: "clamp(28px,4.5vw,52px)", lineHeight: 1.03, letterSpacing: "-0.025em", margin: "0 0 14px" }}>Start reading the smart way.</h2>
              <p style={{ fontSize: "clamp(14px,1.4vw,16px)", lineHeight: 1.55, color: "var(--lp-text2)", margin: "0 0 26px" }}>Paste a link and watch it turn into a deck. No sign-up required.</p>
              <form className="lp-cta-form" onSubmit={handleSubmit}>
                <input type="url" placeholder="Paste a link to any article…" value={url} onChange={(e) => setUrl(e.target.value)} required />
                <button type="submit">Try it now</button>
              </form>
              <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--lp-text3)" }}>
                Or replace <code style={{ background: "var(--lp-surface)", padding: "1px 6px", borderRadius: 5, fontSize: 11.5 }}>https://</code> with <code style={{ background: "var(--lp-surface)", padding: "1px 6px", borderRadius: 5, fontSize: 11.5 }}>storis.in/</code> on any URL.{" "}
                <a href="/install" style={{ color: "var(--lp-accent)", textDecoration: "none", fontWeight: 600 }}>Get the bookmarklet →</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid var(--lp-border)" }}>
        <div className="lp-footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...T, fontWeight: 700, fontSize: 16 }}>Storis</span>
            <span style={{ fontSize: 12.5, color: "var(--lp-text3)", marginLeft: 4 }}>© 2026</span>
          </div>
          <div className="lp-footer-links">
            <a href="#how" style={{ color: "inherit", textDecoration: "none" }}>How it works</a>
            <a href="#explore" style={{ color: "inherit", textDecoration: "none" }}>Explore</a>
            <a href="#features" style={{ color: "inherit", textDecoration: "none" }}>Features</a>
            <a href="/curate" style={{ color: "inherit", textDecoration: "none" }}>Library</a>
            <a href="/install" style={{ color: "inherit", textDecoration: "none" }}>Get bookmarklet</a>
          </div>
        </div>
      </footer>
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
