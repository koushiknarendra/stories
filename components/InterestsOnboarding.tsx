"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/categories";

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

interface Props {
  onComplete: (selected: string[]) => void;
}

export default function InterestsOnboarding({ onComplete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleContinue() {
    if (selected.size < 1 || saving) return;
    setSaving(true);
    try {
      await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: [...selected] }),
      });
      onComplete([...selected]);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--lp-bg)", display: "flex", flexDirection: "column", padding: "env(safe-area-inset-top, 20px) 20px 20px" }}>

      {/* Header */}
      <div style={{ paddingTop: 48, paddingBottom: 36, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
        <h1 style={{ ...SG, fontSize: "clamp(24px,5vw,32px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--lp-text)", margin: "0 0 10px" }}>
          What are you into?
        </h1>
        <p style={{ fontSize: 15, color: "var(--lp-text2)", margin: 0, lineHeight: 1.6 }}>
          Pick topics you enjoy — we&apos;ll find the best reads for you.
        </p>
      </div>

      {/* Categories grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {CATEGORIES.map(({ key, label, emoji }) => {
          const active = selected.has(key);
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              style={{
                ...SG,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 14,
                border: `1.5px solid ${active ? "var(--lp-accent)" : "var(--lp-border)"}`,
                background: active ? "color-mix(in srgb, var(--lp-accent) 12%, transparent)" : "var(--lp-surface)",
                color: active ? "var(--lp-accent)" : "var(--lp-text)",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all .15s",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Continue button */}
      <div style={{ maxWidth: 480, margin: "32px auto 0", width: "100%", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
        {selected.size > 0 && (
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--lp-text3)", marginBottom: 12 }}>
            {selected.size} topic{selected.size > 1 ? "s" : ""} selected
          </p>
        )}
        <button
          onClick={handleContinue}
          disabled={selected.size < 1 || saving}
          style={{
            ...SG,
            width: "100%",
            padding: "15px 0",
            borderRadius: 14,
            border: "none",
            background: selected.size >= 1 ? "var(--lp-accent)" : "var(--lp-border)",
            color: selected.size >= 1 ? "#fff" : "var(--lp-text3)",
            fontWeight: 700,
            fontSize: 15,
            cursor: selected.size >= 1 ? "pointer" : "not-allowed",
            transition: "all .2s",
            boxShadow: selected.size >= 1 ? "0 6px 20px -6px var(--lp-glow)" : "none",
          }}
        >
          {saving ? "Saving…" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
