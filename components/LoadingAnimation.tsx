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

const TRACK = 10;
const TAIL = 4;
const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };
const TAIL_OPACITY = [1, 0.55, 0.28, 0.12];

function Snake() {
  // body[0] = head position, body[1..3] = tail positions
  const [body, setBody] = useState<number[]>([0, -1, -2, -3]);
  const dirRef = useRef(1);

  useEffect(() => {
    const t = setInterval(() => {
      setBody(prev => {
        const head = prev[0];
        let next = head + dirRef.current;
        if (next >= TRACK) { dirRef.current = -1; next = head - 1; }
        else if (next < 0) { dirRef.current = 1; next = head + 1; }
        return [next, ...prev.slice(0, TAIL - 1)];
      });
    }, 110);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
      {Array.from({ length: TRACK }).map((_, i) => {
        const bi = body.indexOf(i);
        const inSnake = bi >= 0;
        const isHead = bi === 0;
        return (
          <div
            key={i}
            style={{
              width: isHead ? 14 : inSnake ? 10 : 8,
              height: isHead ? 14 : inSnake ? 10 : 8,
              borderRadius: "50%",
              background: inSnake ? "var(--lp-accent)" : "rgba(128,128,128,0.2)",
              opacity: inSnake ? (TAIL_OPACITY[bi] ?? 0.1) : 1,
              transition: "width 0.08s ease, height 0.08s ease, opacity 0.08s ease",
            }}
          />
        );
      })}
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
      <Snake />
      <div style={{ textAlign: "center", width: "100%", maxWidth: 320 }}>
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
