"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import InterestsOnboarding from "@/components/InterestsOnboarding";
import StreakWidget from "@/components/StreakWidget";
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
  is_generated?: boolean;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCount: number;
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

function CategoryEmoji({ cat }: { cat: string | null }) {
  const found = CATEGORIES.find((c) => c.key === cat);
  if (!found) return null;
  return <span style={{ fontSize: 11 }}>{found.emoji} {found.label}</span>;
}

function StoryCard({ story, onRead }: { story: StoryItem; onRead: (id: string) => void }) {
  const img = story.cover_image_url || `https://picsum.photos/seed/${story.id}/800/500`;
  return (
    <a
      href={`/stories/${story.id}`}
      onClick={() => onRead(story.id)}
      style={{ textDecoration: "none", display: "block", borderRadius: 20, overflow: "hidden", position: "relative", height: 220, boxShadow: "0 8px 28px -8px rgba(0,0,0,0.18)" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)" }} />

      {/* Badges row */}
      <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 6 }}>
        {story.category && (
          <span style={{ ...SG, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.18)", padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
            <CategoryEmoji cat={story.category} />
          </span>
        )}
        {story.is_generated && (
          <span style={{ ...SG, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", color: "#fff", background: "rgba(34,197,94,0.75)", padding: "4px 9px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
            NEW
          </span>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px" }}>
        <p style={{ ...SG, fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{story.title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
            {story.source_url ? (() => { try { return new URL(story.source_url).hostname.replace("www.", ""); } catch { return story.source; } })() : story.source}
            {" · "}{timeAgo(story.saved_at)}
          </span>
          <span style={{ ...SG, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.18)", padding: "3px 9px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
            Read →
          </span>
        </div>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return <div style={{ height: 220, borderRadius: 20, background: "var(--lp-surface)", border: "1px solid var(--lp-border)" }} />;
}

export default function ForYouPage() {
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();
  const [interests, setInterests] = useState<string[] | null>(null);
  const [savedStories, setSavedStories] = useState<StoryItem[]>([]);
  const [discoverStories, setDiscoverStories] = useState<StoryItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [streak, setStreak] = useState<StreakData | null>(null);

  // Redirect guests
  useEffect(() => {
    if (isLoaded && !user) window.location.href = "/";
  }, [isLoaded, user]);

  // Load interests
  useEffect(() => {
    if (!user) return;
    fetch("/api/interests")
      .then((r) => r.json())
      .then((data) => setInterests(Array.isArray(data) ? data : []))
      .catch(() => setInterests([]));
  }, [user]);

  // Load saved stories + streak in parallel
  useEffect(() => {
    if (!user) return;
    fetch("/api/space")
      .then((r) => r.json())
      .then((data) => { setSavedStories(Array.isArray(data) ? data : []); setLoadingSaved(false); })
      .catch(() => setLoadingSaved(false));

    fetch("/api/streak")
      .then((r) => r.json())
      .then((data) => setStreak(data))
      .catch(() => {});
  }, [user]);

  // Load discover stories (may take longer)
  useEffect(() => {
    if (!user || interests === null || interests.length === 0) {
      setLoadingDiscover(false);
      return;
    }
    setLoadingDiscover(true);
    fetch("/api/discover")
      .then((r) => r.json())
      .then((data) => {
        setDiscoverStories(Array.isArray(data.stories) ? data.stories : []);
        setLoadingDiscover(false);
      })
      .catch(() => setLoadingDiscover(false));
  }, [user, interests]);

  const handleRead = useCallback((storySetId: string) => {
    // Non-blocking: mark read and update streak
    fetch("/api/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storySetId }),
    })
      .then((r) => r.json())
      .then((data) => setStreak(data))
      .catch(() => {});
  }, []);

  if (!isLoaded || interests === null) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--lp-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--lp-border)", borderTopColor: "var(--lp-accent)", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (interests.length === 0) {
    return <InterestsOnboarding onComplete={(cats) => setInterests(cats)} />;
  }

  const matched = savedStories.filter((s) => s.category && interests.includes(s.category));
  const feed = matched.length > 0 ? matched : savedStories;
  const greeting = user?.firstName ? `Hey ${user.firstName} 👋` : "For You";

  void theme;

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-page-bg)", color: "var(--lp-text)", paddingBottom: "calc(78px + env(safe-area-inset-bottom, 0px))" }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, backdropFilter: "var(--lp-glass-blur)", WebkitBackdropFilter: "var(--lp-glass-blur)", background: "var(--lp-glass-nav)", borderBottom: "1px solid var(--lp-glass-border)", padding: "calc(env(safe-area-inset-top, 0px) + 18px) 20px 14px" }}>
        <h1 style={{ ...SG, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 2px", color: "var(--lp-text)" }}>
          {greeting}
        </h1>
        <p style={{ fontSize: 12, color: "var(--lp-text3)", margin: 0 }}>
          Based on your interests · {interests.map((i) => CATEGORIES.find((c) => c.key === i)?.emoji).join(" ")}
        </p>
      </div>

      {/* Streak widget */}
      {streak && (
        <StreakWidget
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          todayCount={streak.todayCount}
        />
      )}

      {/* Discover section */}
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <h2 style={{ ...SG, fontSize: 16, fontWeight: 700, color: "var(--lp-text)", margin: 0 }}>Discover</h2>
          <span style={{ fontSize: 11, color: "var(--lp-text3)" }}>Fresh today · curated for you</span>
        </div>

        {loadingDiscover ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : discoverStories.length === 0 ? (
          <div style={{ padding: "20px", borderRadius: 16, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", textAlign: "center" }}>
            <p style={{ ...SG, fontSize: 14, color: "var(--lp-text2)", margin: 0 }}>No fresh picks right now — check back soon.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {discoverStories.map((story) => (
              <StoryCard key={story.id} story={story} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>

      {/* My Library section */}
      {(loadingSaved || feed.length > 0) && (
        <div style={{ padding: "24px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
            <h2 style={{ ...SG, fontSize: 16, fontWeight: 700, color: "var(--lp-text)", margin: 0 }}>From your library</h2>
            <span style={{ fontSize: 11, color: "var(--lp-text3)" }}>saved articles</span>
          </div>

          {loadingSaved ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 200, borderRadius: 20, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", opacity: 1 - i * 0.25 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {feed.map((story) => (
                <StoryCard key={story.id} story={story} onRead={handleRead} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state (no saved stories and no discover) */}
      {!loadingSaved && !loadingDiscover && feed.length === 0 && discoverStories.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📚</div>
          <p style={{ ...SG, fontSize: 17, fontWeight: 600, color: "var(--lp-text)", margin: "0 0 8px" }}>Your feed is warming up</p>
          <p style={{ fontSize: 14, color: "var(--lp-text2)", margin: "0 0 24px", lineHeight: 1.6 }}>
            Discover stories will appear here shortly. You can also save articles from My Space.
          </p>
          <a href="/space" style={{ ...SG, display: "inline-block", padding: "11px 24px", borderRadius: 12, background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 14px -4px var(--lp-glow)" }}>
            Add your first article →
          </a>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
