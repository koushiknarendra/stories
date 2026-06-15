"use client";

import { useState, useEffect, useRef } from "react";

// ─── Ad slot ─────────────────────────────────────────────────────────────────
// Replace AD_SLOTS content with real network tags (AdSense, Carbon, etc.) when ready.
const AD_SLOTS = [
  {
    label: "Sponsored",
    eyebrow: "Recommended read",
    headline: "Blinkist — Big ideas in 15 minutes",
    body: "Over 7,000 nonfiction titles summarised. Try free for 7 days.",
    cta: "Start free trial →",
    href: "#",
    accent: "#7C5CFF",
  },
  {
    label: "Sponsored",
    eyebrow: "Tools for readers",
    headline: "Readwise — Remember what you read",
    body: "Automatically resurface your Kindle highlights, notes, and Storis cards.",
    cta: "Try Readwise →",
    href: "#",
    accent: "#34D399",
  },
  {
    label: "Sponsored",
    eyebrow: "Level up your reading",
    headline: "Audible — Listen while you commute",
    body: "Turn your saved articles into listening time. 30-day free trial.",
    cta: "Claim free trial →",
    href: "#",
    accent: "#FB923C",
  },
];

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

const DOT_COUNT = 8;
const DOT_SPACING = 16; // px between dots
const ANIM_DURATION = 1.6; // seconds for one dot to travel full width

function PacmanLoader() {
  const [angle, setAngle] = useState(25);
  const opening = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setAngle(a => {
        const next = opening.current ? a + 5 : a - 5;
        if (next >= 28) { opening.current = false; return 28; }
        if (next <= 4)  { opening.current = true;  return 4; }
        return next;
      });
    }, 45);
    return () => clearInterval(t);
  }, []);

  const r = 11, cx = 13, cy = 13;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(-angle));
  const y1 = cy + r * Math.sin(toRad(-angle));
  const x2 = cx + r * Math.cos(toRad(angle));
  const y2 = cy + r * Math.sin(toRad(angle));
  const largeArc = (360 - angle * 2) > 180 ? 1 : 0;

  const trackWidth = DOT_COUNT * DOT_SPACING;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Pacman */}
      <svg width={26} height={26} viewBox="0 0 26 26" style={{ flexShrink: 0, overflow: "visible" }}>
        <path
          d={`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`}
          fill="var(--lp-accent)"
        />
      </svg>

      {/* Dot track — dots flow right → left, eaten by Pacman */}
      <div style={{ position: "relative", width: trackWidth, height: 26, overflow: "hidden" }}>
        <style>{`
          @keyframes dotRTL {
            0%   { transform: translateX(${trackWidth}px); opacity: 0; }
            8%   { opacity: 1; }
            88%  { opacity: 1; }
            100% { transform: translateX(-${DOT_SPACING}px); opacity: 0; }
          }
        `}</style>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              marginTop: -4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "color-mix(in srgb, var(--lp-accent) 45%, var(--lp-text3))",
              animation: `dotRTL ${ANIM_DURATION}s ${(-i * (ANIM_DURATION / DOT_COUNT)).toFixed(2)}s linear infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AdSlot() {
  const [idx] = useState(() => Math.floor(Math.random() * AD_SLOTS.length));
  const ad = AD_SLOTS[idx];

  return (
    <a
      href={ad.href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      style={{
        display: "block",
        width: "100%",
        maxWidth: 320,
        borderRadius: 16,
        padding: "16px 18px",
        background: "var(--lp-glass-surface)",
        backdropFilter: "var(--lp-glass-blur-card)",
        WebkitBackdropFilter: "var(--lp-glass-blur-card)",
        border: "1px solid var(--lp-glass-border)",
        textDecoration: "none",
        boxShadow: "var(--lp-shadow), inset 0 1px 0 rgba(255,255,255,0.1)",
        transition: "transform .15s, box-shadow .15s",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px -6px rgba(0,0,0,0.18)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px -6px rgba(0,0,0,0.12)"; }}
    >
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--lp-text3)", display: "block", marginBottom: 8 }}>{ad.label}</span>
      <p style={{ ...SG, fontSize: 14, fontWeight: 700, color: "var(--lp-text)", margin: "0 0 6px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{ad.headline}</p>
      <p style={{ fontSize: 12.5, color: "var(--lp-text2)", margin: 0, lineHeight: 1.55 }}>{ad.body}</p>
    </a>
  );
}

export default function LoadingAnimation({ label = "Turning article into story cards…" }: { label?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "24px 36px", width: "100%" }}>
      <PacmanLoader />
      <AdSlot />
      <p style={{ fontSize: 13, color: "var(--lp-text3)", margin: 0, letterSpacing: ".02em" }}>
        {label}
      </p>
    </div>
  );
}
