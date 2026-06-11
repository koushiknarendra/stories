"use client";

import { useState, useRef } from "react";

const CARDS = [
  { kind: "cover",  tag: "DEEP WORK",       lines: ["Reclaim", "your focus"],           meta: "WIRED · 9 min read",   sub: "7 cards · about 50 seconds" },
  { kind: "stat",   tag: "BY THE NUMBERS",   stat: "144×",    label: "a day the average person unlocks their phone",  source: "WIRED" },
  { kind: "point",  tag: "THE MECHANISM",    title: "The slot-machine effect",           body: "Pull-to-refresh delivers unpredictable rewards — the same loop that keeps a gambler at the machine.", source: "WIRED" },
  { kind: "point",  tag: "WHY IT COSTS YOU", title: "Attention residue",                 body: "Every switch leaves part of your mind stuck on the last thing. Focus never fully arrives.",           source: "WIRED" },
  { kind: "stat",   tag: "BY THE NUMBERS",   stat: "23 min",  label: "to fully refocus after a single interruption",  source: "WIRED" },
  { kind: "point",  tag: "THE FIX",          title: "Protect the first hour",            body: "Your morning sets the day's dopamine baseline. Guard it before the feed gets to it.",               source: "WIRED" },
  { kind: "final",  title: "You just read a 9-minute piece.", sub: "In about 50 seconds." },
];

interface Props { onProgress: (idx: number, saved: number) => void; }

function Dots({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {CARDS.map((_, i) => (
        <span key={i} style={{ width: i === active ? 16 : 5, height: 5, borderRadius: 999, background: i === active ? "var(--lp-accent)" : "var(--lp-border)", transition: "all .3s" }} />
      ))}
    </div>
  );
}

function CardFooter({ source, active }: { source: string; active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--lp-border)" }}>
      <span style={{ fontSize: 12, color: "var(--lp-text3)", fontWeight: 600, letterSpacing: ".04em" }}>{source}</span>
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
    setDragging(false); setFlyOff(dir);
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
    if (dx > 80) fly("right");
    else if (dx < -80) fly("left");
    else { setDragging(false); setDx(0); setDy(0); }
  };

  const T: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif", color: "var(--lp-text)", letterSpacing: "-0.02em", margin: 0 };
  const so = Math.max(0, Math.min(1, dx / 80));
  const sk = Math.max(0, Math.min(1, -dx / 80));

  function cardContent(card: typeof CARDS[0], cardIdx: number) {
    if (card.kind === "cover") return (
      <>
        <span className="card-tag">{card.tag}</span>
        <div className="card-cover-title" style={T}>{card.lines![0]}<br />{card.lines![1]}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, color: "var(--lp-text2)", fontWeight: 600 }}>{card.meta}</div>
        <div style={{ fontSize: 12, color: "var(--lp-text3)", marginTop: 4, marginBottom: 14 }}>{card.sub}</div>
        <Dots active={cardIdx} />
      </>
    );

    if (card.kind === "stat") return (
      <>
        <span className="card-tag">{card.tag}</span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="card-stat-value" style={T}>{card.stat}</div>
          <div className="card-stat-label" style={{ color: "var(--lp-text2)", lineHeight: 1.4, marginTop: 12 }}>{card.label}</div>
        </div>
        <CardFooter source={card.source!} active={cardIdx} />
      </>
    );

    if (card.kind === "final") return (
      <>
        <div style={{ flex: 1 }} />
        <div style={{ width: 48, height: 48, borderRadius: 16, background: "var(--lp-accent)", color: "var(--lp-on-accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px -8px var(--lp-glow)" }}>
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
        </div>
        <div className="card-final-title" style={T}>{card.title}</div>
        <div style={{ fontSize: 15, color: "var(--lp-text2)", marginTop: 6 }}>{card.sub}</div>
        <div className="card-final-btns">
          <button onClick={() => next(true)} className="card-btn-primary">Save to library</button>
          <button onClick={() => next()} className="card-btn-secondary">Read another</button>
        </div>
        <div style={{ fontSize: 12, color: "var(--lp-text3)", marginTop: 14, fontWeight: 600 }}>WIRED · 9 min → 50 sec</div>
        <div style={{ flex: 1 }} />
      </>
    );

    return (
      <>
        <span className="card-pill-tag">{card.tag}</span>
        <div className="card-point-title" style={T}>{card.title}</div>
        <div className="card-body-text" style={{ color: "var(--lp-text2)", lineHeight: 1.5, marginTop: 12 }}>{card.body}</div>
        <div style={{ flex: 1 }} />
        <CardFooter source={card.source!} active={cardIdx} />
      </>
    );
  }

  return (
    <>
      <style>{`
        .card-base { padding: 24px; }
        .card-tag { font-size: 11px; font-weight: 700; letter-spacing: .14em; color: var(--lp-accent); }
        .card-cover-title { font-weight: 600; font-size: 40px; line-height: 1.02; margin-top: 14px; }
        .card-stat-value { font-weight: 700; font-size: 64px; line-height: 0.9; }
        .card-stat-label { font-size: 16px; }
        .card-point-title { font-weight: 600; font-size: 26px; line-height: 1.1; margin-top: 16px; }
        .card-body-text { font-size: 15px; }
        .card-final-title { font-weight: 700; font-size: 24px; line-height: 1.1; margin-top: 18px; max-width: 16ch; }
        .card-final-btns { display: flex; gap: 8px; margin-top: 20px; width: 100%; }
        .card-btn-primary { flex: 1; padding: 11px 8px; border-radius: var(--lp-radius); border: none; background: var(--lp-accent); color: var(--lp-on-accent); font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .card-btn-secondary { flex: 1; padding: 11px 8px; border-radius: var(--lp-radius); border: 1px solid var(--lp-border); background: transparent; color: var(--lp-text); font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .card-pill-tag { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: .12em; color: var(--lp-accent); padding: 4px 10px; border: 1px solid var(--lp-border); border-radius: 999px; align-self: flex-start; }
        .card-save-badge { position: absolute; top: 18px; left: 18px; padding: 5px 10px; border: 2px solid var(--lp-save); color: var(--lp-save); border-radius: 8px; font-weight: 800; font-size: 12px; letter-spacing: .12em; transform: rotate(-12deg); background: color-mix(in srgb, var(--lp-surface) 80%, transparent); pointer-events: none; }
        .card-less-badge { position: absolute; top: 18px; right: 18px; padding: 5px 10px; border: 2px solid var(--lp-skip); color: var(--lp-skip); border-radius: 8px; font-weight: 800; font-size: 12px; letter-spacing: .12em; transform: rotate(12deg); background: color-mix(in srgb, var(--lp-surface) 80%, transparent); pointer-events: none; }
        @media (max-width: 380px) {
          .card-base { padding: 18px; }
          .card-cover-title { font-size: 32px; }
          .card-stat-value { font-size: 48px; }
          .card-stat-label { font-size: 14px; }
          .card-point-title { font-size: 22px; margin-top: 12px; }
          .card-body-text { font-size: 14px; }
          .card-final-title { font-size: 20px; margin-top: 14px; }
          .card-save-badge, .card-less-badge { font-size: 10px; padding: 3px 7px; top: 12px; }
          .card-save-badge { left: 12px; }
          .card-less-badge { right: 12px; }
        }
      `}</style>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {[2, 1, 0].map((p) => {
          const cardIdx = (idx + p) % CARDS.length;
          const card = CARDS[cardIdx];
          const isTop = p === 0;
          let transform: string, transition: string, opacity = 1;

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
            transform = `translateY(${p * 14}px) scale(${1 - p * 0.045})`;
            transition = "transform .35s ease";
            opacity = p === 2 ? 0.5 : 1;
          }

          return (
            <div
              key={`${card.kind}-${p}`}
              className="card-base"
              style={{
                position: "absolute", inset: 0,
                background: "var(--lp-surface)", border: "1px solid var(--lp-border)",
                borderRadius: "calc(var(--lp-radius) + 8px)",
                boxShadow: "var(--lp-shadow)", display: "flex", flexDirection: "column",
                userSelect: "none", overflow: "hidden",
                transform, transition, opacity, zIndex: 10 - p,
                cursor: isTop ? (dragging ? "grabbing" : "grab") : "default", touchAction: "none",
              }}
              onPointerDown={isTop && !flyOff ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
            >
              {cardContent(card, cardIdx)}
              {isTop && !flyOff && (
                <>
                  <div className="card-save-badge" style={{ opacity: so }}>SAVE</div>
                  <div className="card-less-badge" style={{ opacity: sk }}>LESS</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
