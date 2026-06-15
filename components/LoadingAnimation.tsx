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
    bg: "linear-gradient(135deg, rgba(124,92,255,0.10) 0%, rgba(96,165,250,0.08) 100%)",
    border: "rgba(124,92,255,0.22)",
  },
  {
    label: "Sponsored",
    eyebrow: "Tools for readers",
    headline: "Readwise — Remember what you read",
    body: "Automatically resurface your Kindle highlights, notes, and Storis cards.",
    cta: "Try Readwise →",
    href: "#",
    bg: "linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(96,165,250,0.07) 100%)",
    border: "rgba(52,211,153,0.22)",
  },
  {
    label: "Sponsored",
    eyebrow: "Level up your reading",
    headline: "Audible — Listen while you commute",
    body: "Turn your saved articles into listening time. 30-day free trial.",
    cta: "Claim free trial →",
    href: "#",
    bg: "linear-gradient(135deg, rgba(251,146,60,0.10) 0%, rgba(244,114,182,0.07) 100%)",
    border: "rgba(251,146,60,0.22)",
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
        padding: "14px 16px",
        background: ad.bg,
        border: `1px solid ${ad.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        textDecoration: "none",
        boxShadow: "0 4px 24px -8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)",
        transition: "transform .15s, box-shadow .15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px -8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ ...SG, fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--lp-text3)", opacity: 0.7 }}>{ad.eyebrow}</span>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--lp-text3)", opacity: 0.5 }}>{ad.label}</span>
      </div>
      <p style={{ ...SG, fontSize: 14, fontWeight: 700, color: "var(--lp-text)", margin: "0 0 5px", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{ad.headline}</p>
      <p style={{ fontSize: 12, color: "var(--lp-text2)", margin: "0 0 10px", lineHeight: 1.5 }}>{ad.body}</p>
      <span style={{ ...SG, fontSize: 12, fontWeight: 700, color: "var(--lp-accent)" }}>{ad.cta}</span>
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
