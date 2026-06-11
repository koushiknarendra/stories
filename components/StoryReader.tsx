"use client";

import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { addToCurate, recordDislike } from "@/lib/storage";
import { useTheme } from "@/components/ThemeProvider";
import { useUser } from "@clerk/nextjs";
import type { StorySet, Note } from "@/lib/types";

const SWIPE_THRESHOLD = 80;

const GRADIENTS = [
  "linear-gradient(160deg, #9B7BFF 0%, #2D1060 100%)",
  "linear-gradient(160deg, #FF8FA3 0%, #7C0A1E 100%)",
  "linear-gradient(160deg, #38BDF8 0%, #043558 100%)",
  "linear-gradient(160deg, #FB923C 0%, #6B1E05 100%)",
  "linear-gradient(160deg, #A78BFA 0%, #2E0B5F 100%)",
  "linear-gradient(160deg, #34D399 0%, #022C1E 100%)",
  "linear-gradient(160deg, #F472B6 0%, #5C0A34 100%)",
];

const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', sans-serif" };

interface Props {
  set: StorySet;
  storySetId?: string;
}

export default function StoryReader({ set, storySetId }: Props) {
  const { theme, toggle } = useTheme();
  const { user, isLoaded } = useUser();
  const [cardIndex, setCardIndex] = useState(0);
  const dragged = useRef(false);
  const flying = useRef(false);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -30], [1, 0]);

  const card = set.cards[cardIndex];
  const total = set.cards.length;
  const isLast = cardIndex === total - 1;
  const isFirst = cardIndex === 0;
  const gradient = GRADIENTS[cardIndex % GRADIENTS.length];
  const sid = storySetId || set.id;
  const isLoggedIn = isLoaded && !!user;

  // Load notes for this story set when logged in
  useEffect(() => {
    if (!isLoggedIn || !sid) return;
    fetch(`/api/notes?storySetId=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isLoggedIn, sid]);

  const cardNotes = notes.filter((n) => n.card_index === cardIndex);

  async function saveNote() {
    if (!noteText.trim() || !isLoggedIn || savingNote) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storySetId: sid, cardIndex, content: noteText.trim() }),
      });
      const note = await res.json();
      setNotes((prev) => [...prev, note as Note]);
      setNoteText("");
      setShowNoteInput(false);
    } catch {
      // silent
    } finally {
      setSavingNote(false);
    }
  }

  async function flyOff(dir: 1 | -1) {
    if (flying.current) return;
    flying.current = true;
    await animate(x, dir * 1400, { duration: 0.32, ease: [0.32, 0, 0.67, 0] });
    window.location.href = "/";
  }

  function recordInteraction(action: "like" | "dislike") {
    fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: set.id, storyTitle: set.title, storySource: set.source, action }),
    }).catch(() => {});
  }

  function handleLike() { addToCurate(set); recordInteraction("like"); flyOff(1); }
  function handleNope() { recordDislike(set.id); recordInteraction("dislike"); flyOff(-1); }
  function onDragStart() { dragged.current = false; }
  function onDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 6) dragged.current = true;
  }
  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) handleLike();
    else if (info.offset.x < -SWIPE_THRESHOLD) handleNope();
  }
  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dragged.current || flying.current) return;
    if (showNoteInput) { setShowNoteInput(false); return; }
    x.set(0);
    const rect = e.currentTarget.getBoundingClientRect();
    const tappedLeft = e.clientX - rect.left < rect.width / 2;
    if (tappedLeft) { if (!isFirst) setCardIndex((i) => i - 1); }
    else { setCardIndex(isLast ? 0 : (i) => i + 1); }
  }

  const btnBg = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)";

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none", background: "#000" }}>

      {/* Top bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 18px 10px", position: "relative", zIndex: 30 }}>
        <button
          onClick={() => { window.location.href = storySetId ? "/inbox" : "/"; }}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, backdropFilter: "blur(8px)" }}
        >
          ✕
        </button>
        <span style={{ ...SG, color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
          {set.title}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, backdropFilter: "blur(8px)" }}
          >
            {theme === "dark" ? "☀︎" : "☽"}
          </button>
          {set.sourceUrl && (
            <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...SG, color: "rgba(255,255,255,0.45)", fontSize: 11, textDecoration: "none", fontWeight: 700 }}>
              Source ↗
            </a>
          )}
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          style={{ x, rotate, position: "absolute", inset: 0, touchAction: "none" }}
          whileDrag={{ cursor: "grabbing" }}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onClick={handleCardClick}
        >
          <div style={{ position: "absolute", inset: 0, background: gradient }} />

          {/* Progress bars */}
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, display: "flex", gap: 4, zIndex: 10 }}>
            {set.cards.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= cardIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "background .3s" }} />
            ))}
          </div>

          {/* Source tag */}
          <div style={{ position: "absolute", top: 34, left: 16, zIndex: 10 }}>
            <span style={{ ...SG, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.18)", padding: "5px 12px", borderRadius: 999, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
              {set.source}
            </span>
          </div>

          {/* Note indicator */}
          {cardNotes.length > 0 && (
            <div style={{ position: "absolute", top: 34, right: 16, zIndex: 10 }}>
              <span style={{ ...SG, fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: "rgba(255,220,80,0.9)", background: "rgba(255,220,80,0.15)", padding: "5px 10px", borderRadius: 999, backdropFilter: "blur(10px)" }}>
                ✎ {cardNotes.length} note{cardNotes.length > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* LIKE stamp */}
          <motion.div style={{ opacity: likeOpacity, position: "absolute", top: 80, left: 20, zIndex: 20, border: "3px solid #34D399", borderRadius: 10, padding: "6px 16px", transform: "rotate(-18deg)", pointerEvents: "none", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(6px)" }}>
            <span style={{ ...SG, color: "#34D399", fontWeight: 900, fontSize: 26, letterSpacing: ".1em" }}>LIKE</span>
          </motion.div>

          {/* NOPE stamp */}
          <motion.div style={{ opacity: nopeOpacity, position: "absolute", top: 80, right: 20, zIndex: 20, border: "3px solid #FF6B81", borderRadius: 10, padding: "6px 16px", transform: "rotate(18deg)", pointerEvents: "none", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(6px)" }}>
            <span style={{ ...SG, color: "#FF6B81", fontWeight: 900, fontSize: 26, letterSpacing: ".1em" }}>NOPE</span>
          </motion.div>

          {/* Bottom overlay */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.92) 100%)", padding: "80px 22px 0", zIndex: 10 }}>

            {/* Notes display (when showing existing notes) */}
            {cardNotes.length > 0 && !showNoteInput && (
              <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                {cardNotes.map((note) => (
                  <div key={note.id} style={{ background: "rgba(255,220,80,0.12)", border: "1px solid rgba(255,220,80,0.25)", borderRadius: 10, padding: "8px 12px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,220,80,0.9)", lineHeight: 1.5 }}>✎ {note.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Note input (slide up) */}
            {showNoteInput && (
              <div style={{ marginBottom: 16 }} onClick={(e) => e.stopPropagation()}>
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note for this card…"
                  rows={2}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "white", fontSize: 13, padding: "10px 12px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } if (e.key === "Escape") { setShowNoteInput(false); setNoteText(""); } }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={saveNote} disabled={savingNote || !noteText.trim()} style={{ ...SG, flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "rgba(255,220,80,0.85)", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: savingNote ? 0.6 : 1 }}>
                    {savingNote ? "Saving…" : "Save note"}
                  </button>
                  <button onClick={() => { setShowNoteInput(false); setNoteText(""); }} style={{ ...SG, padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Card content */}
            <h2 style={{ ...SG, fontSize: "clamp(20px,5vw,30px)", fontWeight: 700, color: "white", lineHeight: 1.12, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              {card.headline}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
              {card.bullets.map((b, i) => (
                <li key={i} style={{ display: "flex", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.55 }}>
                  <span style={{ color: "rgba(255,255,255,0.32)", flexShrink: 0, marginTop: 2 }}>—</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            {/* Progress + read time */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: ".04em" }}>{card.readTime} read</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                {isFirst ? "tap right to advance" : isLast ? "tap right to restart" : `${cardIndex + 1} / ${total}`}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, padding: "22px 0 44px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button
                  onClick={handleNope}
                  style={{ width: 62, height: 62, borderRadius: "50%", border: "2px solid rgba(255,107,129,0.5)", background: btnBg, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "#FF6B81", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 20px -4px rgba(255,107,129,0.4)", transition: "transform .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
                <span style={{ ...SG, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: ".06em" }}>Skip</span>
              </div>

              {isLoggedIn && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setShowNoteInput((v) => !v)}
                    style={{ width: 50, height: 50, borderRadius: "50%", border: "2px solid rgba(255,220,80,0.4)", background: btnBg, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "rgba(255,220,80,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform .15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <span style={{ ...SG, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: ".06em" }}>Note</span>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button
                  onClick={handleLike}
                  style={{ width: 62, height: 62, borderRadius: "50%", border: "2px solid rgba(52,211,153,0.5)", background: btnBg, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 20px -4px rgba(52,211,153,0.4)", transition: "transform .15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z" /></svg>
                </button>
                <span style={{ ...SG, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: ".06em" }}>Save</span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
