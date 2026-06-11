"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { addToCurate, recordDislike } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeProvider";
import type { StorySet } from "@/lib/types";

const SWIPE_THRESHOLD = 80;

const GRADIENTS = [
  "linear-gradient(155deg, #9B7BFF 0%, #3B1A8F 100%)",
  "linear-gradient(155deg, #FF8FA3 0%, #9B1C2E 100%)",
  "linear-gradient(155deg, #38BDF8 0%, #075985 100%)",
  "linear-gradient(155deg, #FB923C 0%, #7C2D12 100%)",
  "linear-gradient(155deg, #A78BFA 0%, #3B0764 100%)",
  "linear-gradient(155deg, #34D399 0%, #064E3B 100%)",
  "linear-gradient(155deg, #F472B6 0%, #831843 100%)",
];

function Dots({ total, active }: { total: number; active: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === active ? 14 : 4,
            height: 4,
            borderRadius: 999,
            background: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
            transition: "all .3s",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function StoryReader({ set }: { set: StorySet }) {
  const router = useRouter();
  const [cardIndex, setCardIndex] = useState(0);
  const dragged = useRef(false);
  const flying = useRef(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-12, 12]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -30], [1, 0]);

  const card = set.cards[cardIndex];
  const total = set.cards.length;
  const isLast = cardIndex === total - 1;
  const isFirst = cardIndex === 0;
  const gradient = GRADIENTS[cardIndex % GRADIENTS.length];

  async function flyOff(dir: 1 | -1) {
    if (flying.current) return;
    flying.current = true;
    await animate(x, dir * 1300, { duration: 0.35, ease: [0.32, 0, 0.67, 0] });
    router.push("/");
  }

  function recordInteraction(action: "like" | "dislike") {
    fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: set.id,
        storyTitle: set.title,
        storySource: set.source,
        action,
      }),
    }).catch(() => {});
  }

  function handleLike() {
    addToCurate(set);
    recordInteraction("like");
    flyOff(1);
  }

  function handleNope() {
    recordDislike(set.id);
    recordInteraction("dislike");
    flyOff(-1);
  }

  function onDragStart() { dragged.current = false; }

  function onDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 6) dragged.current = true;
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) handleLike();
    else if (info.offset.x < -SWIPE_THRESHOLD) handleNope();
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dragged.current || flying.current) return;
    x.set(0);
    const rect = e.currentTarget.getBoundingClientRect();
    const tappedLeft = e.clientX - rect.left < rect.width / 2;
    if (tappedLeft) {
      if (!isFirst) setCardIndex((i) => i - 1);
    } else {
      setCardIndex(isLast ? 0 : (i) => i + 1);
    }
  }

  const SG = { fontFamily: "'Space Grotesk', sans-serif" } as React.CSSProperties;

  return (
    <div
      style={{ height: "100dvh", background: "var(--lp-bg)", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none" }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 20px 8px", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/")}
          style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "var(--lp-text3)", cursor: "pointer", fontSize: 18 }}
        >
          ✕
        </button>
        <span style={{ ...SG, color: "var(--lp-text2)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
          {set.title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle className="text-sm" />
          {set.sourceUrl && (
            <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--lp-text3)", fontSize: 11, textDecoration: "none", fontWeight: 600 }}>
              Source ↗
            </a>
          )}
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ display: "flex", gap: 4, padding: "6px 16px 6px", flexShrink: 0 }}>
        {set.cards.map((_, i) => (
          <div key={i} style={{ height: 3, flex: 1, borderRadius: 999, background: i <= cardIndex ? "var(--lp-accent)" : "var(--lp-border)", transition: "background .3s" }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ flex: 1, minHeight: 0, padding: "8px 12px" }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          style={{ x, rotate, width: "100%", height: "100%", position: "relative", cursor: "pointer", touchAction: "none" }}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onClick={handleClick}
        >
          {/* LIKE badge */}
          <motion.div style={{ opacity: likeOpacity, position: "absolute", top: 28, left: 22, zIndex: 10, border: "3px solid #34D399", borderRadius: 10, padding: "5px 14px", transform: "rotate(-18deg)", pointerEvents: "none", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}>
            <span style={{ ...SG, color: "#34D399", fontWeight: 900, fontSize: 22, letterSpacing: ".1em" }}>LIKE</span>
          </motion.div>

          {/* NOPE badge */}
          <motion.div style={{ opacity: nopeOpacity, position: "absolute", top: 28, right: 22, zIndex: 10, border: "3px solid #FF6B81", borderRadius: 10, padding: "5px 14px", transform: "rotate(18deg)", pointerEvents: "none", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}>
            <span style={{ ...SG, color: "#FF6B81", fontWeight: 900, fontSize: 22, letterSpacing: ".1em" }}>NOPE</span>
          </motion.div>

          {/* Card face */}
          <div style={{ width: "100%", height: "100%", background: gradient, borderRadius: 28, overflow: "hidden", boxShadow: "0 28px 60px -16px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column" }}>

            {/* Top: source tag + position */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 22px 0" }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.18)", padding: "5px 11px", borderRadius: 999, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
                {set.source}
              </span>
              <Dots total={total} active={cardIndex} />
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Bottom content with gradient overlay */}
            <div style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.62))", padding: "48px 22px 26px" }}>
              <h2 style={{ ...SG, fontSize: "clamp(22px,5.5vw,30px)", fontWeight: 700, color: "white", lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
                {card.headline}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {card.bullets.map((b, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, color: "rgba(255,255,255,0.82)", fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.55 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0, marginTop: 2 }}>—</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: ".04em" }}>{card.readTime} read</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                  {isFirst ? "tap right · swipe right to save" : isLast ? "tap right to restart" : `${cardIndex + 1} / ${total}`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 56, padding: "16px 0 40px", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <button
            onClick={handleNope}
            style={{ width: 58, height: 58, borderRadius: "50%", border: "2px solid rgba(255,107,129,0.5)", background: "var(--lp-surface)", color: "#FF6B81", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px -6px rgba(255,107,129,0.3)", transition: "transform .15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
          <span style={{ fontSize: 10, color: "var(--lp-text3)", fontWeight: 600, letterSpacing: ".06em" }}>Less of this</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <button
            onClick={handleLike}
            style={{ width: 58, height: 58, borderRadius: "50%", border: "2px solid rgba(52,211,153,0.5)", background: "var(--lp-surface)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px -6px rgba(52,211,153,0.3)", transition: "transform .15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
          </button>
          <span style={{ fontSize: 10, color: "var(--lp-text3)", fontWeight: 600, letterSpacing: ".06em" }}>Save</span>
        </div>
      </div>
    </div>
  );
}
