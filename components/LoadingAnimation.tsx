"use client";

import { useState, useEffect } from "react";
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

const SNAKE_LEN = 6;
const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

export default function LoadingAnimation({ label = "Turning article into story cards…" }: { label?: string }) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [snakePos, setSnakePos] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
      setFadeKey((k) => k + 1);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSnakePos((i) => (i + 1) % (SNAKE_LEN * 2)), 160);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, padding: "24px 36px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {Array.from({ length: SNAKE_LEN }).map((_, i) => {
          const active = i === snakePos % SNAKE_LEN;
          const trail = ((snakePos % SNAKE_LEN) - i + SNAKE_LEN) % SNAKE_LEN;
          const opacity = active ? 1 : trail === 1 ? 0.55 : trail === 2 ? 0.28 : 0.1;
          return (
            <div key={i} style={{ width: active ? 13 : 9, height: active ? 13 : 9, borderRadius: "50%", background: "var(--lp-accent)", opacity, transition: "all 0.15s ease" }} />
          );
        })}
      </div>
      <div style={{ textAlign: "center", minHeight: 80, display: "flex", alignItems: "center" }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={fadeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            style={{ ...SG, fontSize: 15, fontWeight: 600, color: "var(--lp-text)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}
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
