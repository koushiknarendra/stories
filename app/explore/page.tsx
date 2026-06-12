"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import BottomNav from "@/components/BottomNav";
import { CATEGORIES } from "@/lib/categories";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

interface StoryItem {
  id: string;
  title: string;
  source: string;
  source_url: string | null;
  cover_image_url: string | null;
  category: string | null;
  saved_at: string;
}

export default function ExplorePage() {
  const { user, isLoaded } = useUser();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) window.location.href = "/";
  }, [isLoaded, user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/space")
      .then((r) => r.json())
      .then((data) => setStories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  // Derive which categories the user actually has content for
  const usedCategories = CATEGORIES.filter((c) => stories.some((s) => s.category === c.key));
  const filtered = active ? stories.filter((s) => s.category === active) : stories;

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-page-bg)", color: "var(--lp-text)", paddingBottom: "calc(78px + env(safe-area-inset-bottom, 0px))" }}>

      {/* Header + category pills — sticky glass bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, backdropFilter: "var(--lp-glass-blur)", WebkitBackdropFilter: "var(--lp-glass-blur)", background: "var(--lp-glass-nav)", borderBottom: "1px solid var(--lp-glass-border)" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 20px 0" }}>
          <h1 style={{ ...SG, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px" }}>Explore</h1>
          <p style={{ fontSize: 12, color: "var(--lp-text3)", margin: 0 }}>Browse your library by topic</p>
        </div>

        {/* Category pills */}
        <div style={{ padding: "12px 16px 14px", overflowX: "auto", display: "flex", gap: 8, scrollbarWidth: "none" }}>
          <button
            onClick={() => setActive(null)}
            style={{ ...SG, flexShrink: 0, padding: "7px 16px", borderRadius: 999, border: `1.5px solid ${!active ? "var(--lp-accent)" : "var(--lp-glass-border)"}`, background: !active ? "color-mix(in srgb, var(--lp-accent) 14%, transparent)" : "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", color: !active ? "var(--lp-accent)" : "var(--lp-text2)", fontWeight: !active ? 700 : 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}
          >
            All
          </button>
          {usedCategories.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setActive(key === active ? null : key)}
              style={{ ...SG, flexShrink: 0, padding: "7px 16px", borderRadius: 999, border: `1.5px solid ${active === key ? "var(--lp-accent)" : "var(--lp-glass-border)"}`, background: active === key ? "color-mix(in srgb, var(--lp-accent) 14%, transparent)" : "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", color: active === key ? "var(--lp-accent)" : "var(--lp-text2)", fontWeight: active === key ? 700 : 500, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Story grid */}
      <div style={{ padding: "16px 16px 0" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--lp-text3)" }}>
            <p style={{ fontSize: 15, margin: 0 }}>
              {active ? `No ${CATEGORIES.find((c) => c.key === active)?.label} articles yet.` : "Save articles to explore them here."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {filtered.map((story) => {
              const img = story.cover_image_url || `https://picsum.photos/seed/${story.id}/400/300`;
              return (
                <a
                  key={story.id}
                  href={`/stories/${story.id}`}
                  style={{ textDecoration: "none", display: "block", borderRadius: 16, overflow: "hidden", position: "relative", height: 160 }}
                >
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.76) 100%)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
                    <p style={{ ...SG, fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {story.title}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
