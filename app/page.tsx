"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { saveCurrent } from "@/lib/storage";
import { useTheme } from "@/components/ThemeProvider";
import LandingCardStack from "@/components/LandingCardStack";
import type { StorySet } from "@/lib/types";

// ─── Loading screen ───────────────────────────────────────────────────────────

const STATUS = ["Reading the article…", "Finding the key ideas…", "Crafting your story cards…", "Almost there…"];

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

const IconSun  = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4.2} /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" /></svg>;
const IconMoon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;

// ─── CSS ──────────────────────────────────────────────────────────────────────

const STYLES = `
  *{box-sizing:border-box}
  .lp-nav{max-width:1100px;margin:0 auto;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .lp-nav-links{display:flex;align-items:center;gap:28px;font-size:14px;font-weight:500;color:var(--lp-text2)}
  .lp-hero{max-width:1100px;margin:0 auto;padding:100px 32px 80px;display:flex;flex-direction:column;align-items:center;text-align:center}
  .lp-h1{font-family:'Space Grotesk',sans-serif;font-weight:700;line-height:1.05;letter-spacing:-0.03em;font-size:clamp(38px,6vw,78px);margin:0;color:var(--lp-text)}
  .lp-sub{font-size:clamp(16px,1.7vw,19px);line-height:1.7;color:var(--lp-text2);max-width:44ch;margin:20px auto 0}
  .lp-card-wrap{width:min(360px,88vw);height:min(560px,70vh);position:relative}
  .lp-steps{max-width:900px;margin:0 auto;padding:72px 32px 80px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:40px;align-items:start}
  .lp-vaul{max-width:1100px;margin:0 auto;padding:80px 32px 96px;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
  .lp-vaul-h2{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(26px,3.2vw,42px);line-height:1.1;letter-spacing:-0.02em;margin:0 0 16px;color:var(--lp-text)}
  .lp-vaul-p{font-size:clamp(15px,1.3vw,17px);line-height:1.75;color:var(--lp-text2);margin:0}
  .lp-footer{max-width:1100px;margin:0 auto;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}

  @media(max-width:800px){
    .lp-nav{padding:14px 20px}
    .lp-nav-links{display:none}
    .lp-hero{padding:72px 20px 60px}
    .lp-steps{grid-template-columns:1fr;gap:28px;padding:56px 20px 64px}
    .lp-vaul{grid-template-columns:1fr;gap:40px;padding:64px 20px 80px;text-align:center}
    .lp-vaul-visual{display:flex;justify-content:center}
    .lp-footer{padding:24px 20px;flex-direction:column;align-items:flex-start;gap:12px}
  }
  @media(max-width:480px){
    .lp-nav{padding:12px 16px}
    .lp-hero{padding:56px 16px 48px}
    .lp-card-wrap{height:400px}
    .lp-steps{padding:40px 16px 52px;gap:24px}
    .lp-vaul{padding:48px 16px 64px}
    .lp-footer{padding:20px 16px}
  }
`;

// ─── Step card ────────────────────────────────────────────────────────────────

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--lp-accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--lp-accent) 22%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--lp-accent)" }}>
        {n}
      </div>
      <div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--lp-text)", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14.5, color: "var(--lp-text2)", lineHeight: 1.65 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Saved library mockup ─────────────────────────────────────────────────────

function SavedVisual() {
  const rows = [
    { title: "The Model That Changed Everything",  src: "wired.com",        n: 7 },
    { title: "Why Your Brain Forgets on Purpose",  src: "nautilus.co",      n: 6 },
    { title: "The Attention Economy Is Broken",    src: "aeon.co",          n: 7 },
    { title: "How Figma Killed the Design Stack",  src: "stratechery.com",  n: 5 },
  ];
  return (
    <div style={{ background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius-lg)", overflow: "hidden", boxShadow: "var(--lp-shadow)", width: "100%", maxWidth: 420 }}>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--lp-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--lp-text3)" }}>My space</span>
        <span style={{ fontSize: 11, color: "var(--lp-text3)" }}>4 saved</span>
      </div>
      {rows.map(({ title, src, n }, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--lp-border)" : "none" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--lp-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            <div style={{ fontSize: 11.5, color: "var(--lp-text3)", marginTop: 3 }}>{src}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--lp-text3)", background: "var(--lp-surface2)", padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{n} cards</span>
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
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "color-mix(in srgb, var(--lp-bg) 80%, transparent)", borderBottom: "1px solid var(--lp-border)" }}>
        <div className="lp-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ display: "inline-flex", width: 30, height: 30, borderRadius: 8, background: "var(--lp-accent)", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 16px -6px var(--lp-glow)", flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} /><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...SG, fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>Storis</span>
          </div>
          <div className="lp-nav-links">
            {isLoaded && isSignedIn
              ? <a href="/space" style={{ color: "inherit", textDecoration: "none" }}>My space</a>
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
                ? <a href="/space" style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 6px 18px -8px var(--lp-glow)", whiteSpace: "nowrap", textDecoration: "none", display: "inline-block" }}>
                    My space
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
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 13px", borderRadius: 999, border: "1px solid var(--lp-border)", background: "var(--lp-surface)", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--lp-accent)", display: "inline-block" }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--lp-text2)", letterSpacing: ".02em" }}>Any article → story cards</span>
          </div>

          <h1 className="lp-h1">
            The story inside<br />every link.
          </h1>
          <p className="lp-sub">
            Paste any article and get the key ideas as swipeable cards in seconds. Save what's worth keeping, annotate as you go.
          </p>

          {/* URL input */}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, width: "100%", maxWidth: 480, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
            <input
              id="hero-input"
              type="url"
              placeholder="Paste a link to any article…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              style={{ flex: 1, minWidth: 220, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", borderRadius: "var(--lp-radius)", padding: "13px 16px", color: "var(--lp-text)", fontSize: 15, fontFamily: "inherit", outline: "none", transition: "border-color .2s", boxShadow: "0 2px 8px -2px rgba(0,0,0,0.06)" }}
            />
            <button type="submit" style={{ padding: "13px 22px", borderRadius: "var(--lp-radius)", border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 10px 26px -8px var(--lp-glow)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Get the story →
            </button>
          </form>

          {error && (
            <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--lp-skip)", background: "color-mix(in srgb, var(--lp-skip) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--lp-skip) 25%, transparent)", borderRadius: "var(--lp-radius)", padding: "10px 14px", maxWidth: 480, width: "100%", margin: "12px auto 0" }}>
              {error}
            </p>
          )}

          <p style={{ marginTop: 16, fontSize: 12.5, color: "var(--lp-text3)" }}>
            Free to try · No sign-up needed
          </p>

          {/* Card demo */}
          <div style={{ margin: "52px 0 0", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="lp-card-wrap">
              <LandingCardStack onProgress={() => {}} />
            </div>
          </div>
        </div>
      </header>

      {/* How it works */}
      <div style={{ borderTop: "1px solid var(--lp-border)", background: "var(--lp-bg2)" }}>
        <div className="lp-steps">
          <Step
            n="1"
            title="Paste any link"
            body="Articles, threads, newsletters, essays — any URL works. Storis fetches and reads it for you."
          />
          <Step
            n="2"
            title="Get story cards"
            body="The key ideas become 7 swipeable cards. Signal without the scroll. Done in under 10 seconds."
          />
          <Step
            n="3"
            title="Save and annotate"
            body="Like a card to save it to your space. Add notes as you read. Pick up exactly where you left off."
          />
        </div>
      </div>

      {/* Value prop */}
      <div style={{ borderTop: "1px solid var(--lp-border)" }}>
        <div className="lp-vaul">
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--lp-accent)", marginBottom: 16 }}>Your space</div>
            <h2 className="lp-vaul-h2">Everything worth reading, in one place.</h2>
            <p className="lp-vaul-p">
              Every story you save lives in My Space — organised, searchable, and always ready to revisit. Add notes on individual cards, edit them anytime, and never lose a good idea again.
            </p>
            {isLoaded && !isSignedIn && (
              <SignInButton>
                <button style={{ marginTop: 28, padding: "11px 22px", borderRadius: "var(--lp-radius)", border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 20px -8px var(--lp-glow)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Start your space — it's free
                </button>
              </SignInButton>
            )}
          </div>
          <div className="lp-vaul-visual">
            <SavedVisual />
          </div>
        </div>
      </div>

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
