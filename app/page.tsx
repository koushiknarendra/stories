"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
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
            <div style={{ height: 9, background: "var(--lp-surface2)", borderRadius: 999, width: "30%", marginBottom: 14 }} />
            <div style={{ height: 16, background: "var(--lp-border)", borderRadius: 8, width: "70%", marginBottom: 8 }} />
            <div style={{ height: 16, background: "var(--lp-border)", borderRadius: 8, width: "50%", marginBottom: 18 }} />
            {[1, 0.8, 0.6].map((w, j) => <div key={j} style={{ height: 10, background: "var(--lp-surface2)", borderRadius: 6, width: `${w * 100}%`, marginBottom: 7 }} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconSun = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4.2} /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" /></svg>;
const IconMoon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;

// ─── CSS ──────────────────────────────────────────────────────────────────────

const STYLES = `
  *{box-sizing:border-box}
  .lp-nav{max-width:1100px;margin:0 auto;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .lp-nav-links{display:flex;align-items:center;gap:28px;font-size:14px;font-weight:500;color:var(--lp-text2)}
  .lp-hero{max-width:1100px;margin:0 auto;padding:96px 32px 80px;display:flex;flex-direction:column;align-items:center;text-align:center}
  .lp-h1{font-family:'Space Grotesk',sans-serif;font-weight:700;line-height:1.0;letter-spacing:-0.035em;font-size:clamp(40px,7vw,86px);margin:0;color:var(--lp-text)}
  .lp-sub{font-size:clamp(16px,1.8vw,20px);line-height:1.65;color:var(--lp-text2);max-width:46ch;margin:24px auto 0}
  .lp-card-wrap{width:min(360px,88vw);height:min(580px,72vh);position:relative}
  .lp-vaul{max-width:1100px;margin:0 auto;padding:80px 32px 96px;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
  .lp-vaul-h2{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(28px,3.6vw,48px);line-height:1.05;letter-spacing:-0.025em;margin:0 0 18px;color:var(--lp-text)}
  .lp-vaul-p{font-size:clamp(15px,1.4vw,18px);line-height:1.7;color:var(--lp-text2);margin:0}
  .lp-footer{max-width:1100px;margin:0 auto;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}

  @media(max-width:800px){
    .lp-nav{padding:14px 20px}
    .lp-nav-links{display:none}
    .lp-hero{padding:72px 20px 64px}
    .lp-vaul{grid-template-columns:1fr;gap:40px;padding:64px 20px 80px;text-align:center}
    .lp-vaul-visual{display:flex;justify-content:center}
    .lp-footer{padding:24px 20px;flex-direction:column;align-items:flex-start;gap:12px}
  }
  @media(max-width:480px){
    .lp-nav{padding:12px 16px}
    .lp-hero{padding:56px 16px 48px}
    .lp-card-wrap{height:420px}
    .lp-vaul{padding:48px 16px 64px;gap:28px}
    .lp-footer{padding:20px 16px}
  }
`;

// ─── Saved library mockup ─────────────────────────────────────────────────────

function SavedVisual() {
  const rows = [
    { tag: "AI",       title: "The Model That Changed Everything",  src: "wired.com" },
    { tag: "Science",  title: "Why Your Brain Forgets on Purpose",  src: "nautilus.co" },
    { tag: "Ideas",    title: "The Attention Economy Is Broken",    src: "aeon.co" },
    { tag: "Business", title: "How Figma Killed the Design Stack",  src: "stratechery.com" },
  ];
  return (
    <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", overflow: "hidden", boxShadow: "var(--lp-shadow)", width: "100%", maxWidth: 420 }}>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--lp-border)", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--lp-text3)" }}>
        Your library · 4 saved
      </div>
      {rows.map(({ tag, title, src }, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--lp-border)" : "none" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--lp-accent)", background: "color-mix(in srgb, var(--lp-accent) 12%, transparent)", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{tag}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--lp-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            <div style={{ fontSize: 11.5, color: "var(--lp-text3)", marginTop: 2 }}>{src}</div>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="var(--lp-save)" style={{ flexShrink: 0 }}><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();
  const { isLoaded, isSignedIn } = useUser();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", color: "var(--lp-text)", overflowX: "hidden" }}>
      <style>{STYLES}</style>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "color-mix(in srgb, var(--lp-bg) 78%, transparent)", borderBottom: "1px solid var(--lp-border)" }}>
        <div className="lp-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ display: "inline-flex", width: 30, height: 30, borderRadius: 8, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px -6px var(--lp-glow)", flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} /><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...SG, fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>Storis</span>
          </div>
          <div className="lp-nav-links">
            {isLoaded && isSignedIn
              ? <a href="/inbox" style={{ color: "inherit", textDecoration: "none" }}>Inbox</a>
              : <a href="/curate" style={{ color: "inherit", textDecoration: "none" }}>Library</a>
            }
            <a href="/install" style={{ color: "inherit", textDecoration: "none" }}>Bookmarklet</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggle} aria-label="Toggle theme" style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid var(--lp-border)", background: "var(--lp-surface)", color: "var(--lp-text)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            {isLoaded && (
              isSignedIn
                ? <a href="/inbox" style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 6px 18px -8px var(--lp-glow)", whiteSpace: "nowrap", textDecoration: "none", display: "inline-block" }}>
                    My inbox
                  </a>
                : <SignInButton>
                    <button style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 6px 18px -8px var(--lp-glow)", whiteSpace: "nowrap" }}>
                      Sign in
                    </button>
                  </SignInButton>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header>
        <div className="lp-hero">
          <h1 className="lp-h1">
            You consume everything.<br />You remember nothing.
          </h1>
          <p className="lp-sub">
            The internet is chaos — more articles, threads, and newsletters than any mind can hold. Storis turns any of it into story cards. The signal, not the scroll.
          </p>

          <div style={{ margin: "52px 0 0", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="lp-card-wrap">
              <LandingCardStack onProgress={() => {}} />
            </div>
          </div>

          <div style={{ marginTop: 40 }} />

          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, width: "100%", maxWidth: 460, flexWrap: "wrap", justifyContent: "center" }}>
            <input
              id="hero-input"
              type="url"
              placeholder="Paste a link to any article…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={{ flex: 1, minWidth: 220, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius)", padding: "13px 16px", color: "var(--lp-text)", fontSize: 15, fontFamily: "inherit", outline: "none", transition: "border-color .2s" }}
            />
            <button type="submit" style={{ padding: "13px 22px", borderRadius: "var(--lp-radius)", border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 10px 26px -8px var(--lp-glow)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Get the story
            </button>
          </form>

          {error && (
            <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--lp-skip)", background: "color-mix(in srgb, var(--lp-skip) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--lp-skip) 25%, transparent)", borderRadius: "var(--lp-radius)", padding: "10px 14px", maxWidth: 460, width: "100%", margin: "12px auto 0" }}>
              {error}
            </p>
          )}

          <p style={{ marginTop: 18, fontSize: 12.5, color: "var(--lp-text3)" }}>
            Web · <a href="/install" style={{ color: "inherit", textDecoration: "none" }}>Bookmarklet</a> · Mobile coming soon
          </p>
        </div>
      </header>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--lp-border)" }} />

      {/* Value prop */}
      <section style={{ background: "var(--lp-bg2)" }}>
        <div className="lp-vaul">
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 16 }}>Your reading, distilled.</div>
            <h2 className="lp-vaul-h2">A story for everything you meant to read.</h2>
            <p className="lp-vaul-p">
              You open the link. You get two paragraphs in. Something else pulls you away. Storis reads it for you, pulls out what actually matters, and hands it back as seven cards you can swipe through in under a minute — saved to your library, forever.
            </p>
          </div>
          <div className="lp-vaul-visual">
            <SavedVisual />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--lp-border)" }}>
        <div className="lp-footer">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: 6, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...SG, fontWeight: 700, fontSize: 15 }}>Storis</span>
            <span style={{ fontSize: 12, color: "var(--lp-text3)", marginLeft: 4 }}>© 2026</span>
          </div>
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--lp-text2)", fontWeight: 500, flexWrap: "wrap" }}>
            <a href="/curate" style={{ color: "inherit", textDecoration: "none" }}>Library</a>
            <a href="/install" style={{ color: "inherit", textDecoration: "none" }}>Bookmarklet</a>
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
