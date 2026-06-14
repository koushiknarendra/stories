"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function LoadingAnimation({ label = "Turning article into story cards…" }: { label?: string }) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length);
      setFadeKey(k => k + 1);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, padding: "24px 36px" }}>
      <PacmanLoader />

      {/* Fixed-height quote container prevents layout shift when text changes */}
      <div style={{ textAlign: "center", width: "100%", maxWidth: 320, minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={fadeKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{ ...SG, fontSize: 15, fontWeight: 600, color: "var(--lp-text)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}
          >
            &ldquo;{QUOTES[quoteIdx]}&rdquo;
          </motion.p>
        </AnimatePresence>
      </div>

      <p style={{ fontSize: 13, color: "var(--lp-text3)", margin: 0, letterSpacing: ".02em" }}>
        {label}
      </p>
    </div>
  );
}
