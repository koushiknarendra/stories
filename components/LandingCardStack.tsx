"use client";

import { useState, useRef } from "react";

const CARDS = [
  {
    id: "cover",
    gradient: "linear-gradient(155deg, #9B7BFF 0%, #3B1A8F 100%)",
    tag: "DEEP WORK · WIRED",
    headline: "Reclaim\nyour focus",
    body: "Cal Newport on why distraction is the real crisis of our time.",
    source: "9 min → 7 cards",
    layout: "cover" as const,
  },
  {
    id: "stat1",
    gradient: "linear-gradient(155deg, #FF8FA3 0%, #9B1C2E 100%)",
    tag: "BY THE NUMBERS",
    headline: "144×",
    body: "a day the average person unlocks their phone",
    source: "WIRED",
    layout: "stat" as const,
  },
  {
    id: "point1",
    gradient: "linear-gradient(155deg, #38BDF8 0%, #075985 100%)",
    tag: "THE MECHANISM",
    headline: "The slot-machine effect",
    body: "Pull-to-refresh delivers unpredictable rewards — the same loop that keeps a gambler at the machine.",
    source: "WIRED",
    layout: "point" as const,
  },
  {
    id: "point2",
    gradient: "linear-gradient(155deg, #FB923C 0%, #7C2D12 100%)",
    tag: "WHY IT COSTS YOU",
    headline: "Attention residue",
    body: "Every switch leaves part of your mind stuck on the last thing. Focus never fully arrives.",
    source: "WIRED",
    layout: "point" as const,
  },
  {
    id: "stat2",
    gradient: "linear-gradient(155deg, #A78BFA 0%, #3B0764 100%)",
    tag: "BY THE NUMBERS",
    headline: "23 min",
    body: "to fully refocus after a single interruption",
    source: "WIRED",
    layout: "stat" as const,
  },
  {
    id: "point3",
    gradient: "linear-gradient(155deg, #34D399 0%, #064E3B 100%)",
    tag: "THE FIX",
    headline: "Protect the first hour",
    body: "Your morning sets the day's dopamine baseline. Guard it before the feed gets to it.",
    source: "WIRED",
    layout: "point" as const,
  },
  {
    id: "final",
    gradient: "linear-gradient(155deg, #7C5CFF 0%, #2D1B8E 100%)",
    tag: "COMPLETE",
    headline: "9 minutes in 50 seconds.",
    body: "That's the whole story, distilled.",
    source: "WIRED · Deep Work",
    layout: "final" as const,
  },
];

interface Props { onProgress: (idx: number, saved: number) => void; }

function Dots({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {CARDS.map((_, i) => (
        <span key={i} style={{ width: i === active ? 14 : 4, height: 4, borderRadius: 999, background: i === active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", transition: "all .3s" }} />
      ))}
    </div>
  );
}

function CardFace({ card, cardIdx }: { card: typeof CARDS[0]; cardIdx: number }) {
  const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

  const tag = (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.18)", padding: "5px 11px", borderRadius: 999, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
      {card.tag}
    </span>
  );

  if (card.layout === "stat") return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {tag}
        <Dots active={cardIdx} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 24px", textAlign: "center" }}>
        <div style={{ ...SG, fontSize: "clamp(72px,18vw,96px)", fontWeight: 800, lineHeight: 1, color: "white", letterSpacing: "-0.04em" }}>{card.headline}</div>
        <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "clamp(14px,3.5vw,17px)", lineHeight: 1.5, marginTop: 18, maxWidth: "22ch" }}>{card.body}</div>
      </div>
      <div style={{ padding: "0 22px 24px" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: ".04em" }}>{card.source}</span>
      </div>
    </div>
  );

  if (card.layout === "cover") return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {tag}
        <Dots active={cardIdx} />
      </div>
      <div style={{ flex: 1 }} />
      {/* Bottom gradient overlay */}
      <div style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.55))", padding: "48px 22px 24px" }}>
        <div style={{ ...SG, fontSize: "clamp(36px,9vw,48px)", fontWeight: 700, color: "white", lineHeight: 1.05, letterSpacing: "-0.03em", whiteSpace: "pre-line" }}>{card.headline}</div>
        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.55, marginTop: 11 }}>{card.body}</div>
        <div style={{ marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: ".04em" }}>{card.source}</div>
      </div>
    </div>
  );

  if (card.layout === "final") return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22, backdropFilter: "blur(8px)" }}>
        <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
      </div>
      <div style={{ ...SG, fontSize: "clamp(26px,6.5vw,32px)", fontWeight: 700, color: "white", letterSpacing: "-0.025em", lineHeight: 1.1 }}>{card.headline}</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(14px,3.5vw,16px)", marginTop: 12, lineHeight: 1.5 }}>{card.body}</div>
      <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: ".04em" }}>{card.source}</div>
      <Dots active={cardIdx} />
    </div>
  );

  // point
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "22px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {tag}
        <Dots active={cardIdx} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.5))", padding: "48px 22px 24px" }}>
        <div style={{ ...SG, fontSize: "clamp(24px,6vw,30px)", fontWeight: 700, color: "white", letterSpacing: "-0.02em", lineHeight: 1.15 }}>{card.headline}</div>
        <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.6, marginTop: 13 }}>{card.body}</div>
        <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: ".04em" }}>{card.source}</div>
      </div>
    </div>
  );
}

export default function LandingCardStack({ onProgress }: Props) {
  const [idx, setIdx] = useState(0);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flyOff, setFlyOff] = useState<"left" | "right" | null>(null);
  const [saved, setSaved] = useState(0);
  const startRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  const next = (wasSaved?: boolean) => {
    const ni = (idx + 1) % CARDS.length;
    const ns = wasSaved ? saved + 1 : saved;
    setIdx(ni); setDx(0); setDy(0); setFlyOff(null);
    if (wasSaved !== undefined) setSaved(ns);
    onProgress(ni, wasSaved !== undefined ? ns : saved);
  };

  const fly = (dir: "left" | "right") => {
    setDragging(false); setFlyOff(dir);
    setTimeout(() => next(dir === "right"), 280);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (flyOff) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const nx = e.clientX - startRef.current.x, ny = e.clientY - startRef.current.y;
    if (Math.abs(nx) > 4 || Math.abs(ny) > 4) movedRef.current = true;
    setDx(nx); setDy(ny);
  };

  const onPointerUp = () => {
    if (!dragging) return;
    if (!movedRef.current) { next(); setDragging(false); return; }
    if (dx > 80) fly("right");
    else if (dx < -80) fly("left");
    else { setDragging(false); setDx(0); setDy(0); }
  };

  const saveOpacity = Math.max(0, Math.min(1, dx / 80));
  const skipOpacity = Math.max(0, Math.min(1, -dx / 80));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%" }}>
      {/* Stack */}
      <div style={{ position: "relative", width: "100%", flex: 1 }}>
        {[2, 1, 0].map((p) => {
          const cardIdx = (idx + p) % CARDS.length;
          const card = CARDS[cardIdx];
          const isTop = p === 0;
          let transform: string, transition: string, opacity = 1;

          if (isTop) {
            if (flyOff) {
              const s = flyOff === "right" ? 1 : -1;
              transform = `translate(${s * 600}px, -20px) rotate(${s * 24}deg)`;
              transition = "transform .28s cubic-bezier(.4,0,.2,1), opacity .28s";
              opacity = 0;
            } else if (dragging) {
              transform = `translate(${dx}px,${dy * 0.4}px) rotate(${dx * 0.035}deg)`;
              transition = "none";
            } else {
              transform = "translate(0,0) rotate(0)";
              transition = "transform .4s cubic-bezier(.2,.8,.2,1)";
            }
          } else {
            transform = `translateY(${p * 12}px) scale(${1 - p * 0.04})`;
            transition = "transform .32s ease";
            opacity = p === 2 ? 0.55 : 1;
          }

          return (
            <div
              key={card.id + p}
              style={{
                position: "absolute", inset: 0,
                background: card.gradient,
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: isTop ? "0 28px 60px -16px rgba(0,0,0,0.45)" : "0 10px 30px -10px rgba(0,0,0,0.25)",
                transform, transition, opacity,
                zIndex: 10 - p,
                cursor: isTop ? (dragging ? "grabbing" : "grab") : "default",
                touchAction: "none",
                userSelect: "none",
              }}
              onPointerDown={isTop && !flyOff ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
            >
              <CardFace card={card} cardIdx={cardIdx} />

              {/* NOPE stamp */}
              {isTop && !flyOff && (
                <div style={{ position: "absolute", top: 28, left: 22, padding: "6px 14px", border: "3px solid #FF6B81", borderRadius: 10, color: "#FF6B81", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: ".1em", transform: "rotate(-18deg)", opacity: skipOpacity, pointerEvents: "none", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}>
                  NOPE
                </div>
              )}
              {/* LIKE stamp */}
              {isTop && !flyOff && (
                <div style={{ position: "absolute", top: 28, right: 22, padding: "6px 14px", border: "3px solid #34D399", borderRadius: 10, color: "#34D399", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: ".1em", transform: "rotate(18deg)", opacity: saveOpacity, pointerEvents: "none", background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}>
                  LIKE
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 24, flexShrink: 0 }}>
        <button
          onClick={() => !flyOff && fly("left")}
          aria-label="Skip"
          style={{ width: 58, height: 58, borderRadius: "50%", border: "2px solid rgba(255,107,129,0.6)", background: "transparent", color: "#FF6B81", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .2s, transform .15s", boxShadow: "0 4px 16px -6px rgba(255,107,129,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>

        <button
          onClick={() => !flyOff && next()}
          aria-label="Next"
          style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(124,92,255,0.4)", background: "transparent", color: "var(--lp-accent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform .15s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>

        <button
          onClick={() => !flyOff && fly("right")}
          aria-label="Save"
          style={{ width: 58, height: 58, borderRadius: "50%", border: "2px solid rgba(52,211,153,0.6)", background: "transparent", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .2s, transform .15s", boxShadow: "0 4px 16px -6px rgba(52,211,153,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
        </button>
      </div>
    </div>
  );
}
