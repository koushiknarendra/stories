"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

interface StoryItem {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  saved_at: string;
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

export default function CollectionPage() {
  useTheme();
  const params = useParams();
  const id = params.id as string;

  const [items, setItems] = useState<StoryItem[]>([]);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAll = id === "all";
  const accent = "var(--lp-accent)";
  const text = "var(--lp-text)";
  const text2 = "var(--lp-text2)";
  const text3 = "var(--lp-text3)";

  useEffect(() => {
    if (isAll) {
      setName("All Stories");
      fetch("/api/space")
        .then((r) => r.json())
        .then((data) => setItems(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/collections/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setItems(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      // Fetch collection name from the list
      fetch("/api/collections")
        .then((r) => r.json())
        .then((cols) => {
          const col = Array.isArray(cols) ? cols.find((c: { id: string; name: string }) => c.id === id) : null;
          if (col) setName(col.name);
        })
        .catch(() => {});
    }
  }, [id, isAll]);

  async function handleShare(itemId: string, title: string) {
    const url = `${window.location.origin}/stories/${itemId}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  async function handleRemove(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (!isAll) {
      await fetch(`/api/collections/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storySetId: itemId }),
      }).catch(() => {});
    } else {
      await fetch("/api/space", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      }).catch(() => {});
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-page-bg)", color: text, paddingBottom: "calc(78px + env(safe-area-inset-bottom, 0px))" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "var(--lp-glass-blur)", WebkitBackdropFilter: "var(--lp-glass-blur)", background: "var(--lp-glass-nav)", borderBottom: "1px solid var(--lp-glass-border)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/space" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: text, textDecoration: "none", flexShrink: 0 }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div>
            <h1 style={{ ...SG, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: text }}>{name || "Collection"}</h1>
            <p style={{ fontSize: 11, color: text3, margin: "2px 0 0" }}>{items.length} {items.length === 1 ? "story" : "stories"}</p>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 20px 80px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2.5px solid var(--lp-border)`, borderTopColor: accent, animation: "spin .7s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: text3 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📂</div>
            <p style={{ ...SG, fontSize: 16, fontWeight: 600, color: text, margin: "0 0 8px" }}>
              {isAll ? "No stories saved yet" : "Collection is empty"}
            </p>
            <p style={{ fontSize: 14, color: text2, margin: 0, lineHeight: 1.6 }}>
              {isAll ? "Save stories from your feed to see them here." : "Save a story to this collection to get started."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{ background: "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", border: "1px solid var(--lp-glass-border)", borderRadius: 16, overflow: "hidden", display: "flex", alignItems: "stretch", boxShadow: "0 2px 16px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)" }}
              >
                {item.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.cover_image_url} alt="" style={{ width: 72, flexShrink: 0, objectFit: "cover" }} />
                )}
                <div style={{ flex: 1, minWidth: 0, padding: "14px 14px 14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.category && (
                      <span style={{ ...SG, display: "inline-block", fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: accent, marginBottom: 4 }}>{item.category}</span>
                    )}
                    <p style={{ ...SG, fontSize: 14, fontWeight: 600, color: text, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: text3, margin: 0 }}>
                      {item.source_url ? (() => { try { return new URL(item.source_url).hostname; } catch { return item.source; } })() : item.source}
                      {" · "}{timeAgo(item.saved_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <a href={`/stories/${item.id}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 9, background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent, textDecoration: "none", fontSize: 16 }}>
                      →
                    </a>
                    <button
                      onClick={() => handleShare(item.id, item.title)}
                      aria-label="Share"
                      style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "transparent", color: copiedId === item.id ? "#34D399" : text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color .2s" }}
                    >
                      {copiedId === item.id
                        ? <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                        : <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                      }
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      aria-label={isAll ? "Delete" : "Remove"}
                      style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "transparent", color: text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, transition: "color .15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6B81")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = text3)}
                    >✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
