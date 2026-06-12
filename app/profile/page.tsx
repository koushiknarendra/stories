"use client";

import { useState, useEffect } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import BottomNav from "@/components/BottomNav";
import { CATEGORIES } from "@/lib/categories";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

const IconSun  = () => <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx={12} cy={12} r={4.2}/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>;
const IconMoon = () => <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>;

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { theme, toggle } = useTheme();
  const [interests, setInterests] = useState<string[]>([]);
  const [storyCount, setStoryCount] = useState<number | null>(null);
  const [editingInterests, setEditingInterests] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) window.location.href = "/";
  }, [isLoaded, user]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/interests").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) { setInterests(data); setSelected(new Set(data)); }
    }).catch(() => {});
    fetch("/api/space").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setStoryCount(data.length);
    }).catch(() => {});
  }, [user]);

  async function saveInterests() {
    setSaving(true);
    await fetch("/api/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: [...selected] }),
    }).catch(() => {});
    setInterests([...selected]);
    setEditingInterests(false);
    setSaving(false);
  }

  function toggleCat(key: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-page-bg)", color: "var(--lp-text)", paddingBottom: "calc(78px + env(safe-area-inset-bottom, 0px))" }}>

      {/* Top bar */}
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ ...SG, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Profile</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", color: "var(--lp-text)", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          <SignOutButton>
            <button style={{ ...SG, fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 9, border: "1px solid var(--lp-glass-border)", background: "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", color: "var(--lp-text2)", cursor: "pointer" }}>
              Sign out
            </button>
          </SignOutButton>
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>

        {/* Avatar + name */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, padding: "18px 18px", background: "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", border: "1px solid var(--lp-glass-border)", borderRadius: 18, boxShadow: "0 4px 24px -8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            {user.imageUrl
              ? <img src={user.imageUrl} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                  {(user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "?")[0].toUpperCase()}
                </div>
            }
            <div>
              <p style={{ ...SG, margin: 0, fontSize: 16, fontWeight: 700, color: "var(--lp-text)" }}>
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName ?? "Reader"}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--lp-text3)" }}>
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Saved articles", value: storyCount ?? "—" },
            { label: "Interests", value: interests.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", border: "1px solid var(--lp-glass-border)", borderRadius: 14, padding: "16px 18px", textAlign: "center", boxShadow: "0 4px 20px -8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
              <p style={{ ...SG, fontSize: 26, fontWeight: 700, color: "var(--lp-accent)", margin: "0 0 4px" }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--lp-text3)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Interests section */}
        <div style={{ background: "var(--lp-glass-surface)", backdropFilter: "var(--lp-glass-blur-card)", WebkitBackdropFilter: "var(--lp-glass-blur-card)", border: "1px solid var(--lp-glass-border)", borderRadius: 18, padding: "18px 18px", marginBottom: 16, boxShadow: "0 4px 24px -8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingInterests ? 16 : (interests.length > 0 ? 14 : 0) }}>
            <p style={{ ...SG, fontSize: 14, fontWeight: 700, color: "var(--lp-text)", margin: 0 }}>My interests</p>
            <button
              onClick={() => { setEditingInterests((v) => !v); setSelected(new Set(interests)); }}
              style={{ ...SG, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid var(--lp-border)", background: "transparent", color: "var(--lp-text2)", cursor: "pointer" }}
            >
              {editingInterests ? "Cancel" : "Edit"}
            </button>
          </div>

          {editingInterests ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {CATEGORIES.map(({ key, label, emoji }) => {
                  const active = selected.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCat(key)}
                      style={{ ...SG, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${active ? "var(--lp-accent)" : "var(--lp-border)"}`, background: active ? "color-mix(in srgb, var(--lp-accent) 10%, transparent)" : "transparent", color: active ? "var(--lp-accent)" : "var(--lp-text2)", fontSize: 13, fontWeight: active ? 700 : 500, cursor: "pointer", transition: "all .15s", textAlign: "left" }}
                    >
                      <span>{emoji}</span><span>{label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={saveInterests}
                disabled={saving}
                style={{ ...SG, width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving…" : "Save interests"}
              </button>
            </>
          ) : interests.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {interests.map((key) => {
                const cat = CATEGORIES.find((c) => c.key === key);
                return cat ? (
                  <span key={key} style={{ ...SG, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999, background: "color-mix(in srgb, var(--lp-accent) 10%, transparent)", color: "var(--lp-accent)", border: "1px solid color-mix(in srgb, var(--lp-accent) 25%, transparent)" }}>
                    {cat.emoji} {cat.label}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--lp-text3)", margin: 0 }}>No interests set — tap Edit to pick some.</p>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
