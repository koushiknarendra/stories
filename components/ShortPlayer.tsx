"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { StorySet } from "@/lib/types";

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

function extractVideoId(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const shortsMatch = u.pathname.match(/\/shorts\/([A-Za-z0-9_-]+)/);
    if (shortsMatch) return shortsMatch[1];
    return u.searchParams.get("v");
  } catch { return null; }
}

export default function ShortPlayer({ set, storySetId }: { set: StorySet; storySetId?: string }) {
  const { isSignedIn } = useUser();
  const [copied, setCopied] = useState(false);
  const videoId = extractVideoId(set.sourceUrl);
  const shareUrl = storySetId
    ? `${typeof window !== "undefined" ? window.location.origin : "https://storis.in"}/stories/${storySetId}`
    : set.sourceUrl ?? "";

  async function handleShare() {
    if (navigator.share) {
      navigator.share({ title: set.title, url: shareUrl }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(shareUrl).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-page-bg)", color: "var(--lp-text)", display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: "calc(78px + env(safe-area-inset-bottom, 0px))" }}>

      {/* Nav */}
      <nav style={{ width: "100%", position: "sticky", top: 0, zIndex: 50, backdropFilter: "var(--lp-glass-blur)", WebkitBackdropFilter: "var(--lp-glass-blur)", background: "var(--lp-glass-nav)", borderBottom: "1px solid var(--lp-glass-border)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 12px) 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/" style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lp-text)", textDecoration: "none", flexShrink: 0 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </a>
          <span style={{ ...SG, fontSize: 15, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>YouTube Short</span>
          <button
            onClick={handleShare}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", display: "flex", alignItems: "center", justifyContent: "center", color: copied ? "#34D399" : "var(--lp-text)", cursor: "pointer" }}
          >
            {copied
              ? <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
              : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: 480, padding: "20px 16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

        {/* Embedded Short */}
        {videoId ? (
          <div style={{ width: "100%", maxWidth: 340, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 40px -8px rgba(0,0,0,0.28)", aspectRatio: "9/16", background: "#000", position: "relative" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title={set.title}
            />
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 340, borderRadius: 20, aspectRatio: "9/16", background: "var(--lp-glass-surface)", border: "1px solid var(--lp-glass-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lp-text3)", fontSize: 14 }}>
            Video unavailable
          </div>
        )}

        {/* Title */}
        <div style={{ width: "100%", textAlign: "center" }}>
          <h1 style={{ ...SG, fontSize: 18, fontWeight: 700, color: "var(--lp-text)", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>{set.title}</h1>
          {set.sourceUrl && (
            <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--lp-accent)", textDecoration: "none" }}>
              Watch on YouTube ↗
            </a>
          )}
        </div>

        {/* Sign-in nudge for guests */}
        {!isSignedIn && (
          <div style={{ width: "100%", background: "var(--lp-glass-surface)", border: "1px solid var(--lp-glass-border)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ ...SG, fontSize: 13, color: "var(--lp-text2)", margin: "0 0 10px" }}>Sign in to save this Short to your library</p>
            <a href="/sign-in" style={{ display: "inline-block", padding: "8px 20px", borderRadius: 9, background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Sign in</a>
          </div>
        )}
      </div>
    </div>
  );
}
