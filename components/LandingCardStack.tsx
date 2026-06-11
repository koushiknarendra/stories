"use client";

import { useState, useRef } from "react";

const CARDS = [
  { kind: "cover",  tag: "DEEP WORK",       lines: ["Reclaim", "your focus"],           meta: "WIRED · 9 min read",   sub: "7 cards · about 50 seconds" },
  { kind: "stat",   tag: "BY THE NUMBERS",   stat: "144×",    label: "a day the average person unlocks their phone",                         source: "WIRED" },
  { kind: "point",  tag: "THE MECHANISM",    title: "The slot-machine effect",           body: "Pull-to-refresh delivers unpredictable rewards — the same loop that keeps a gambler at the machine.", source: "WIRED" },
  { kind: "point",  tag: "WHY IT COSTS YOU", title: "Attention residue",                 body: "Every switch leaves part of your mind stuck on the last thing. Focus never fully arrives.",           source: "WIRED" },
  { kind: "stat",   tag: "BY THE NUMBERS",   stat: "23 min",  label: "to fully refocus after a single interruption",                         source: "WIRED" },
  { kind: "point",  tag: "THE FIX",          title: "Protect the first hour",            body: "Your morning sets the day's dopamine baseline. Guard it before the feed gets to it.",               source: "WIRED" },
  { kind: "final",  title: "You just read a 9-minute piece.", sub: "In about 50 seconds." },
];

interface Props {
  onProgress: (idx: number, saved: number) => void;
}

function Dots({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {CARDS.map((_, i) => (
        <span key={i} style={{
          width: i === active ? 18 : 6, height: 6, borderRadius: 999,
          background: i === active ? "var(--lp-accent)" : "var(--lp-border)",
          transition: "all .3s",
        }} />
      ))}
    </div>
  );
}

function CardFooter({ source, active }: { source: string; active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--lp-border)" }}>
      <span style={{ fontSize: 12.5, color: "var(--lp-text3)", fontWeight: 600, letterSpacing: ".04em" }}>{source}</span>
      <Dots active={active} />
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
    setDragging(false);
    setFlyOff(dir);
    setTimeout(() => next(dir === "right"), 270);
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
    if (dx > 110) fly("right");
    else if (dx < -110) fly("left");
    else { setDragging(false); setDx(0); setDy(0); }
  };

  const base: React.CSSProperties = {
    position: "absolute", inset: 0,
    background: "var(--lp-surface)", border: "1px solid var(--lp-border)",
    borderRadius: "calc(var(--lp-radius) + 8px)", padding: 28,
    boxShadow: "var(--lp-shadow)", display: "flex", flexDirection: "column",
    userSelect: "none", overflow: "hidden",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Space Grotesk', sans-serif", color: "var(--lp-text)",
    letterSpacing: "-0.02em", margin: 0,
  };

  function cardContent(card: typeof CARDS[0], cardIdx: number) {
    if (card.kind === "cover") return (
      <>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".14em", color: "var(--lp-accent)" }}>{card.tag}</span>
        <div style={{ ...titleStyle, fontWeight: 600, fontSize: 44, lineHeight: 1.02, marginTop: 16 }}>
          {card.lines![0]}<br />{card.lines![1]}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13.5, color: "var(--lp-text2)", fontWeight: 600 }}>{card.meta}</div>
        <div style={{ fontSize: 13, color: "var(--lp-text3)", marginTop: 4, marginBottom: 18 }}>{card.sub}</div>
        <Dots active={cardIdx} />
      </>
    );

    if (card.kind === "stat") return (
      <>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".14em", color: "var(--lp-accent)" }}>{card.tag}</span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ ...titleStyle, fontWeight: 700, fontSize: 72, lineHeight: 0.9 }}>{card.stat}</div>
          <div style={{ fontSize: 18, color: "var(--lp-text2)", lineHeight: 1.4, marginTop: 14, maxWidth: "20ch" }}>{card.label}</div>
        </div>
        <CardFooter source={card.source!} active={cardIdx} />
      </>
    );

    if (card.kind === "final") return (
      <>
        <div style={{ flex: 1 }} />
        <div style={{ width: 56, height: 56, borderRadius: 18, background: "var(--lp-accent)", color: "var(--lp-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px -8px var(--lp-glow)" }}>
          <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
        </div>
        <div style={{ ...titleStyle, fontWeight: 700, fontSize: 27, lineHeight: 1.1, marginTop: 22, maxWidth: "16ch" }}>{card.title}</div>
        <div style={{ fontSize: 16, color: "var(--lp-text2)", marginTop: 8 }}>{card.sub}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 24, width: "100%" }}>
          <button onClick={() => next(true)} style={{ flex: 1, padding: "12px", borderRadius: "var(--lp-radius)", border: "none", background: "var(--lp-accent)", color: "var(--lp-on-accent)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Save to library</button>
          <button onClick={() => next()} style={{ flex: 1, padding: "12px", borderRadius: "var(--lp-radius)", border: "1px solid var(--lp-border)", background: "transparent", color: "var(--lp-text)", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Read another</button>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--lp-text3)", marginTop: 18, fontWeight: 600 }}>WIRED · 9 min → 50 sec</div>
        <div style={{ flex: 1 }} />
      </>
    );

    // point
    return (
      <>
        <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 700, letterSpacing: ".12em", color: "var(--lp-accent)", padding: "5px 11px", border: "1px solid var(--lp-border)", borderRadius: 999, alignSelf: "flex-start" }}>{card.tag}</span>
        <div style={{ ...titleStyle, fontWeight: 600, fontSize: 31, lineHeight: 1.08, marginTop: 20 }}>{card.title}</div>
        <div style={{ fontSize: 17, color: "var(--lp-text2)", lineHeight: 1.5, marginTop: 14 }}>{card.body}</div>
        <div style={{ flex: 1 }} />
        <CardFooter source={card.source!} active={cardIdx} />
      </>
    );
  }

  const so = Math.max(0, Math.min(1, dx / 100));
  const sk = Math.max(0, Math.min(1, -dx / 100));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {[2, 1, 0].map((p) => {
        const cardIdx = (idx + p) % CARDS.length;
        const card = CARDS[cardIdx];
        const isTop = p === 0;

        let transform: string;
        let transition: string;
        let opacity = 1;

        if (isTop) {
          if (flyOff) {
            const s = flyOff === "right" ? 1 : -1;
            transform = `translate(${s * 560}px,-30px) rotate(${s * 22}deg)`;
            transition = "transform .27s cubic-bezier(.4,0,.2,1), opacity .27s";
            opacity = 0;
          } else if (dragging) {
            transform = `translate(${dx}px,${dy}px) rotate(${dx * 0.04}deg)`;
            transition = "none";
          } else {
            transform = "translate(0,0) rotate(0)";
            transition = "transform .45s cubic-bezier(.2,.8,.2,1)";
          }
        } else {
          transform = `translateY(${p * 16}px) scale(${1 - p * 0.05})`;
          transition = "transform .35s ease";
          opacity = p === 2 ? 0.55 : 1;
        }

        return (
          <div
            key={`${card.kind}-${p}`}
            style={{ ...base, transform, transition, opacity, zIndex: 10 - p, cursor: isTop ? (dragging ? "grabbing" : "grab") : "default", touchAction: "none" }}
            onPointerDown={isTop && !flyOff ? onPointerDown : undefined}
            onPointerMove={isTop ? onPointerMove : undefined}
            onPointerUp={isTop ? onPointerUp : undefined}
            onPointerCancel={isTop ? onPointerUp : undefined}
          >
            {cardContent(card, cardIdx)}
            {isTop && !flyOff && (
              <>
                <div style={{ position: "absolute", top: 22, left: 22, padding: "6px 13px", border: "2.5px solid var(--lp-save)", color: "var(--lp-save)", borderRadius: 10, fontWeight: 800, fontSize: 14, letterSpacing: ".12em", transform: "rotate(-12deg)", opacity: so, background: "color-mix(in srgb, var(--lp-surface) 80%, transparent)", pointerEvents: "none" }}>SAVE</div>
                <div style={{ position: "absolute", top: 22, right: 22, padding: "6px 13px", border: "2.5px solid var(--lp-skip)", color: "var(--lp-skip)", borderRadius: 10, fontWeight: 800, fontSize: 14, letterSpacing: ".12em", transform: "rotate(12deg)", opacity: sk, background: "color-mix(in srgb, var(--lp-surface) 80%, transparent)", pointerEvents: "none" }}>LESS</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
