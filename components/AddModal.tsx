"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };
type Tab = "link" | "text" | "file";

interface Props { open: boolean; onClose: () => void; }

const QUOTES = [
  "Reading is to the mind what exercise is to the body.",
  "The more that you read, the more things you will know.",
  "A reader lives a thousand lives before he dies.",
  "Today a reader, tomorrow a leader.",
  "Books are a uniquely portable magic.",
  "The reading of all good books is like conversation with the finest minds.",
  "Not all readers are leaders, but all leaders are readers.",
  "A book is a dream that you hold in your hands.",
];

const SNAKE_LEN = 6;

function LoadingOverlay() {
  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [snakePos, setSnakePos] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
      setFadeKey((k) => k + 1);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSnakePos((i) => (i + 1) % (SNAKE_LEN * 2)), 160);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0, background: "var(--lp-bg)", zIndex: 10,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 28, padding: "0 36px", borderRadius: "inherit",
    }}>
      {/* Nokia-snake-style dot runner */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {Array.from({ length: SNAKE_LEN }).map((_, i) => {
          const active = i === snakePos % SNAKE_LEN;
          const trail = ((snakePos % SNAKE_LEN) - i + SNAKE_LEN) % SNAKE_LEN;
          const opacity = active ? 1 : trail === 1 ? 0.55 : trail === 2 ? 0.28 : 0.1;
          return (
            <div
              key={i}
              style={{
                width: active ? 13 : 9,
                height: active ? 13 : 9,
                borderRadius: "50%",
                background: "var(--lp-accent)",
                opacity,
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </div>

      {/* Cycling quote */}
      <div style={{ textAlign: "center", minHeight: 80, display: "flex", alignItems: "center" }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={fadeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            style={{ ...SG, fontSize: 15, fontWeight: 600, color: "var(--lp-text)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}
          >
            &ldquo;{QUOTES[quoteIdx]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      <p style={{ fontSize: 13, color: "var(--lp-text3)", margin: 0, letterSpacing: ".02em" }}>
        Turning article into story cards…
      </p>
    </div>
  );
}

export default function AddModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("link");
  const [urlInput, setUrlInput]   = useState("");
  const [textInput, setTextInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() { setUrlInput(""); setTextInput(""); setTitleInput(""); setError(""); setDone(false); setLoading(false); }

  async function handleLink() {
    const url = urlInput.trim();
    if (!url || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.startsWith("http") ? url : "https://" + url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      reset(); setDone(true);
      setTimeout(() => { setDone(false); onClose(); window.location.href = "/space"; }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleText() {
    const text = textInput.trim();
    if (!text || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title: titleInput.trim() || "Pasted text", source: "Manual entry" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Conversion failed");
      await fetch("/api/space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      reset(); setDone(true);
      setTimeout(() => { setDone(false); onClose(); window.location.href = "/space"; }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const accent = "var(--lp-accent)";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "var(--lp-bg)", borderRadius: "24px 24px 0 0", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 36px)", boxShadow: "0 -12px 48px rgba(0,0,0,0.24)", border: "1px solid var(--lp-glass-border)", borderBottom: "none", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading overlay shown while converting */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: "inherit" }}
                >
                  <LoadingOverlay />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--lp-border)" }} />
            </div>

            <div style={{ padding: "4px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ ...SG, fontSize: 18, fontWeight: 700, color: "var(--lp-text)", margin: 0 }}>Add to Library</h2>
                <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "var(--lp-surface)", color: "var(--lp-text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✕</button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "var(--lp-surface)", borderRadius: 14, padding: 4 }}>
                {(["link", "text", "file"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(""); }}
                    style={{ ...SG, flex: 1, padding: "8px 4px", borderRadius: 11, border: "none", background: tab === t ? accent : "transparent", color: tab === t ? "#fff" : "var(--lp-text2)", fontWeight: tab === t ? 700 : 500, fontSize: 13, cursor: "pointer", transition: "all .15s" }}
                  >
                    {t === "link" ? "🔗 Link" : t === "text" ? "📝 Text" : "📄 File"}
                  </button>
                ))}
              </div>

              {/* Success */}
              {done && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 42, marginBottom: 10 }}>✅</div>
                  <p style={{ ...SG, fontSize: 15, fontWeight: 600, color: "var(--lp-text)" }}>Added to Library!</p>
                </div>
              )}

              {/* Link tab */}
              {!done && tab === "link" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    autoFocus
                    style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--lp-border)", background: "var(--lp-glass-surface)", color: "var(--lp-text)", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", width: "100%" }}
                    onKeyDown={(e) => e.key === "Enter" && handleLink()}
                  />
                  <button
                    onClick={handleLink}
                    disabled={loading || !urlInput.trim()}
                    style={{ ...SG, padding: "14px 0", borderRadius: 12, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading || !urlInput.trim() ? "not-allowed" : "pointer", opacity: loading || !urlInput.trim() ? 0.65 : 1, boxShadow: "0 4px 16px -4px rgba(124,92,255,0.5)", transition: "opacity .15s" }}
                  >
                    Convert to cards
                  </button>
                </div>
              )}

              {/* Text tab */}
              {!done && tab === "text" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Title (optional)"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    style={{ padding: "11px 16px", borderRadius: 12, border: "1.5px solid var(--lp-border)", background: "var(--lp-glass-surface)", color: "var(--lp-text)", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", width: "100%" }}
                  />
                  <textarea
                    placeholder="Paste any text — article, newsletter, essay…"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={6}
                    style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid var(--lp-border)", background: "var(--lp-glass-surface)", color: "var(--lp-text)", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "none", lineHeight: 1.55, boxSizing: "border-box", width: "100%" }}
                  />
                  <button
                    onClick={handleText}
                    disabled={loading || !textInput.trim()}
                    style={{ ...SG, padding: "14px 0", borderRadius: 12, border: "none", background: accent, color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading || !textInput.trim() ? "not-allowed" : "pointer", opacity: loading || !textInput.trim() ? 0.65 : 1, boxShadow: "0 4px 16px -4px rgba(124,92,255,0.5)", transition: "opacity .15s" }}
                  >
                    Convert to cards
                  </button>
                </div>
              )}

              {/* File tab */}
              {!done && tab === "file" && (
                <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                  <p style={{ ...SG, fontSize: 15, fontWeight: 600, color: "var(--lp-text)", margin: "0 0 6px" }}>PDF upload</p>
                  <p style={{ fontSize: 13, color: "var(--lp-text3)", margin: 0, lineHeight: 1.5 }}>Coming soon — paste the PDF link or copy its text for now.</p>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} />
                </div>
              )}

              {error && (
                <p style={{ fontSize: 13, color: "#FF6B81", margin: "10px 0 0", padding: "10px 14px", background: "rgba(255,107,129,0.08)", borderRadius: 10, border: "1px solid rgba(255,107,129,0.18)" }}>
                  {error}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
