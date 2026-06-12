"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import InterestsOnboarding from "@/components/InterestsOnboarding";
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

export default function ForYouPage() {
  const { user, isLoaded } = useUser();
  const { theme } = useTheme();
  const [interests, setInterests] = useState<string[] | null>(null);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);

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

  // Load stories
  useEffect(() => {
    if (!user) return;
    fetch("/api/space")
      .then((r) => r.json())
      .then((data) => { setStories(Array.isArray(data) ? data : []); setLoadingStories(false); })
      .catch(() => setLoadingStories(false));
  }, [user]);

  // Show interests onboarding until user has set at least one
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

  // Filter stories by interests if any match, otherwise show all
  const matched = stories.filter((s) => s.category && interests.includes(s.category));
  const feed = matched.length > 0 ? matched : stories;

  const greeting = user?.firstName ? `Hey ${user.firstName} 👋` : "For You";

  void theme; // used via CSS vars

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", color: "var(--lp-text)", paddingBottom: "calc(78px + env(safe-area-inset-bottom, 0px))" }}>

      {/* Header */}
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 24px) 20px 0" }}>
        <h1 style={{ ...SG, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 4px", color: "var(--lp-text)" }}>
          {greeting}
        </h1>
        <p style={{ fontSize: 13, color: "var(--lp-text3)", margin: "0 0 20px" }}>
          Based on your interests · {interests.map((i) => CATEGORIES.find((c) => c.key === i)?.emoji).join(" ")}
        </p>
      </div>

      {/* Feed */}
      <div style={{ padding: "0 16px" }}>
        {loadingStories ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 200, borderRadius: 20, background: "var(--lp-surface)", border: "1px solid var(--lp-border)", opacity: 1 - i * 0.25 }} />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>📚</div>
            <p style={{ ...SG, fontSize: 17, fontWeight: 600, color: "var(--lp-text)", margin: "0 0 8px" }}>Your feed is waiting</p>
            <p style={{ fontSize: 14, color: "var(--lp-text2)", margin: "0 0 24px", lineHeight: 1.6 }}>
              Save articles from My Space and they&apos;ll appear here, personalized to your interests.
            </p>
            <a href="/space" style={{ ...SG, display: "inline-block", padding: "11px 24px", borderRadius: 12, background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 14px -4px var(--lp-glow)" }}>
              Add your first article →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {feed.map((story) => {
              const img = story.cover_image_url || `https://picsum.photos/seed/${story.id}/800/500`;
              return (
                <a
                  key={story.id}
                  href={`/stories/${story.id}`}
                  style={{ textDecoration: "none", display: "block", borderRadius: 20, overflow: "hidden", position: "relative", height: 220, boxShadow: "0 8px 28px -8px rgba(0,0,0,0.18)" }}
                >
                  {/* Cover image */}
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  {/* Dark gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%)" }} />
                  {/* Category pill */}
                  <div style={{ position: "absolute", top: 14, left: 14 }}>
                    {story.category && (
                      <span style={{ ...SG, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.18)", padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
                        <CategoryEmoji cat={story.category} />
                      </span>
                    )}
                  </div>
                  {/* Content */}
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
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
