"use client";

import { useState, useEffect, useRef } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

const IconSun = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
    <circle cx={12} cy={12} r={4.2} /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
  </svg>
);
const IconMoon = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </svg>
);

interface SpaceItem {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  saved_at: string;
}

interface StarredBullet {
  id: string;
  story_set_id: string;
  story_title: string;
  card_index: number;
  bullet_index: number;
  bullet_text: string;
  created_at: string;
}

interface DailyCard {
  storySetId: string;
  storyTitle: string;
  cardIndex: number;
  headline: string;
  bullet: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SpacePage() {
  const { user } = useUser();
  const { theme, toggle } = useTheme();
  const [items, setItems] = useState<SpaceItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Daily card
  const [dailyCard, setDailyCard] = useState<DailyCard | null | undefined>(undefined);

  // Starred bullets
  const [starredBullets, setStarredBullets] = useState<StarredBullet[]>([]);
  const [showAllStars, setShowAllStars] = useState(false);

  // Ask my library
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.source_url ?? "").toLowerCase().includes(q)
        );
      })
    : items;

  async function handleShare(id: string, title: string) {
    const url = `${window.location.origin}/stories/${id}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  async function loadItems() {
    const data = await fetch("/api/space").then((r) => r.json()).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
  }

  async function loadStarredBullets() {
    const data = await fetch("/api/stars?all=1").then((r) => r.json()).catch(() => []);
    setStarredBullets(Array.isArray(data) ? data : []);
  }

  async function loadDailyCard() {
    const data = await fetch("/api/daily").then((r) => r.json()).catch(() => null);
    setDailyCard(data);
  }

  useEffect(() => {
    loadItems();
    loadStarredBullets();
    loadDailyCard();
  }, []);

  // Scroll chat to bottom when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const val = urlInput.trim();
    if (!val) return;
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: val.startsWith("http") ? val : "https://" + val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setUrlInput("");
      await loadItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch("/api/space", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  async function handleUnstar(bullet: StarredBullet) {
    setStarredBullets((prev) => prev.filter((b) => b.id !== bullet.id));
    await fetch("/api/stars", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storySetId: bullet.story_set_id, cardIndex: bullet.card_index, bulletIndex: bullet.bullet_index }),
    }).catch(() => {});
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = askQuestion.trim();
    if (!q || askLoading) return;
    setAskQuestion("");
    setChat((prev) => [...prev, { role: "user", content: q }]);
    setAskLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const { answer } = await res.json();
      setChat((prev) => [...prev, { role: "assistant", content: answer ?? "Something went wrong." }]);
    } catch {
      setChat((prev) => [...prev, { role: "assistant", content: "Couldn't reach the server. Try again." }]);
    } finally {
      setAskLoading(false);
    }
  }

  const surface = "var(--lp-surface)";
  const border  = "var(--lp-border)";
  const text    = "var(--lp-text)";
  const text2   = "var(--lp-text2)";
  const text3   = "var(--lp-text3)";
  const accent  = "var(--lp-accent)";
  const bg      = "var(--lp-bg)";

  const visibleStars = showAllStars ? starredBullets : starredBullets.slice(0, 5);

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: `color-mix(in srgb, ${bg} 78%, transparent)`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: 7, background: accent, alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px -4px rgba(124,92,255,0.6)", flexShrink: 0 }}>
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(-9 12 12)" fill="white" opacity={0.5} /><rect x={6.5} y={4.5} width={11} height={15} rx={2.6} transform="rotate(7 12 12)" fill="white" /></svg>
            </span>
            <span style={{ ...SG, fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em", color: text }}>Storis</span>
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {user.imageUrl && (
                  <img src={user.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                )}
                <span style={{ fontSize: 13, color: text2, fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.firstName || user.emailAddresses[0]?.emailAddress}
                </span>
              </div>
            )}
            <button onClick={toggle} aria-label="Toggle theme" style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${border}`, background: surface, color: text, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {theme === "dark" ? <IconSun /> : <IconMoon />}
            </button>
            <SignOutButton>
              <button style={{ ...SG, fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 8, border: `1px solid ${border}`, background: surface, color: text2, cursor: "pointer" }}>
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* ── Daily card ── */}
        {dailyCard && (
          <div style={{ marginBottom: 36 }}>
            <p style={{ ...SG, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: text3, margin: "0 0 10px" }}>Today&apos;s pick</p>
            <a href={`/stories/${dailyCard.storySetId}`} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ background: "linear-gradient(135deg, rgba(124,92,255,0.14) 0%, rgba(124,92,255,0.04) 100%)", border: `1px solid rgba(124,92,255,0.22)`, borderRadius: 16, padding: "18px 20px", transition: "border-color .15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(124,92,255,0.45)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(124,92,255,0.22)")}
              >
                <p style={{ fontSize: 11, color: text3, margin: "0 0 6px" }}>{dailyCard.storyTitle}</p>
                <p style={{ ...SG, fontSize: 15, fontWeight: 600, color: text, margin: "0 0 8px", lineHeight: 1.35 }}>{dailyCard.headline}</p>
                {dailyCard.bullet && (
                  <p style={{ fontSize: 13, color: text2, margin: 0, lineHeight: 1.5 }}>— {dailyCard.bullet}</p>
                )}
                <p style={{ fontSize: 11, color: accent, margin: "10px 0 0", fontWeight: 600 }}>Read cards →</p>
              </div>
            </a>
          </div>
        )}

        <h1 style={{ ...SG, fontSize: "clamp(26px,5vw,36px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px", color: text }}>
          My space
        </h1>
        <p style={{ fontSize: 15, color: text2, margin: "0 0 32px" }}>
          Add any link — article, thread, newsletter — and it becomes story cards.
        </p>

        {/* Add form */}
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10, marginBottom: error ? 10 : 28 }}>
          <input
            ref={inputRef}
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a link…"
            disabled={adding}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${border}`, background: surface, color: text, outline: "none", fontFamily: "inherit", transition: "border-color .15s" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = border)}
          />
          <button
            type="submit"
            disabled={adding || !urlInput.trim()}
            style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 14, cursor: adding ? "not-allowed" : "pointer", opacity: adding ? 0.7 : 1, whiteSpace: "nowrap", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 4px 14px -4px rgba(124,92,255,0.5)", transition: "opacity .15s" }}
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>

        {error && (
          <p style={{ fontSize: 13, color: "#FF6B81", margin: "0 0 20px", padding: "10px 14px", background: "rgba(255,107,129,0.08)", borderRadius: 10, border: "1px solid rgba(255,107,129,0.2)" }}>
            {error}
          </p>
        )}

        {/* Search */}
        {items.length > 0 && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: text3, pointerEvents: "none" }}>
              <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your space…"
              style={{ width: "100%", padding: "11px 16px 11px 36px", borderRadius: 12, border: `1.5px solid ${border}`, background: surface, color: text, outline: "none", fontFamily: "inherit", fontSize: 14, boxSizing: "border-box", transition: "border-color .15s" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = border)}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: text3, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}>✕</button>
            )}
          </div>
        )}

        {/* Story list */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: text3 }}>
            <p style={{ fontSize: 15, margin: 0 }}>Your space is empty — add the first link above.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: text3 }}>
            <p style={{ fontSize: 15, margin: 0 }}>No stories match &ldquo;{query}&rdquo;.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item) => (
              <div key={item.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...SG, fontSize: 14, fontWeight: 600, color: text, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: 12, color: text3, margin: 0 }}>
                    {item.source_url ? (() => { try { return new URL(item.source_url).hostname; } catch { return item.source; } })() : item.source}
                    {" · "}{timeAgo(item.saved_at)}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleShare(item.id, item.title)}
                    aria-label="Share"
                    style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: copiedId === item.id ? "#34D399" : text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color .2s" }}
                  >
                    {copiedId === item.id
                      ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                      : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    }
                  </button>
                  <a href={`/stories/${item.id}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 9, background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent, textDecoration: "none", fontSize: 16 }}>
                    →
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", color: text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "color .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B81")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = text3)}
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Starred bullets ── */}
        {starredBullets.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ ...SG, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: text3, margin: 0 }}>
                ★ Starred insights
              </p>
              <span style={{ fontSize: 12, color: text3 }}>{starredBullets.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visibleStars.map((bullet) => (
                <div key={bullet.id} style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "#FBBF24", fontSize: 13, flexShrink: 0, marginTop: 1 }}>★</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: text, margin: "0 0 4px", lineHeight: 1.5 }}>{bullet.bullet_text}</p>
                    <a href={`/stories/${bullet.story_set_id}`} style={{ fontSize: 11, color: text3, textDecoration: "none", fontWeight: 500 }}>
                      {bullet.story_title}
                    </a>
                  </div>
                  <button
                    onClick={() => handleUnstar(bullet)}
                    aria-label="Unstar"
                    style={{ background: "none", border: "none", color: text3, cursor: "pointer", fontSize: 14, padding: 2, flexShrink: 0 }}
                  >✕</button>
                </div>
              ))}
            </div>
            {starredBullets.length > 5 && (
              <button
                onClick={() => setShowAllStars((v) => !v)}
                style={{ ...SG, marginTop: 10, fontSize: 12, fontWeight: 600, color: accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {showAllStars ? "Show less" : `Show all ${starredBullets.length}`}
              </button>
            )}
          </div>
        )}

        {/* ── Ask my library ── */}
        {items.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <p style={{ ...SG, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: text3, margin: "0 0 14px" }}>
              Ask my library
            </p>

            {/* Chat log */}
            {chat.length > 0 && (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                {chat.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "85%",
                      background: msg.role === "user"
                        ? `color-mix(in srgb, ${accent} 18%, transparent)`
                        : surface,
                      border: `1px solid ${msg.role === "user" ? `color-mix(in srgb, ${accent} 30%, transparent)` : border}`,
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      padding: "10px 14px",
                      fontSize: 13,
                      color: text,
                      lineHeight: 1.55,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {askLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px 14px 14px 4px", padding: "10px 14px", fontSize: 13, color: text3 }}>
                      Thinking…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Ask input */}
            <form onSubmit={handleAsk} style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="What did I read about AI agents?"
                disabled={askLoading}
                style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${border}`, background: surface, color: text, outline: "none", fontFamily: "inherit", fontSize: 14, transition: "border-color .15s" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = border)}
              />
              <button
                type="submit"
                disabled={askLoading || !askQuestion.trim()}
                style={{ padding: "11px 18px", borderRadius: 12, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: askLoading ? "not-allowed" : "pointer", opacity: askLoading ? 0.6 : 1, fontFamily: "'Space Grotesk', sans-serif", transition: "opacity .15s" }}
              >
                Ask
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
