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
import { useUser, useClerk, SignInButton } from "@clerk/nextjs";
import type { StorySet, Note } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

interface StarredKey { cardIndex: number; bulletIndex: number; }
function starKey(cardIndex: number, bulletIndex: number) { return `${cardIndex}_${bulletIndex}`; }

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
  const { theme } = useTheme();
  const { user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [pendingSave, setPendingSave] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [resumed, setResumed] = useState(false);
  const dragged = useRef(false);
  const flying = useRef(false);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Starred bullets state — Set of "cardIndex_bulletIndex" strings
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [togglingBullet, setTogglingBullet] = useState<string | null>(null);

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
  // Cover image: OG image from article, or deterministic Picsum fallback keyed by story ID
  const coverImg = set.coverImageUrl || `https://picsum.photos/seed/${set.id}/800/500`;
  const isLoggedIn = isLoaded && !!user;

  // Load notes for this story set when logged in
  useEffect(() => {
    if (!isLoggedIn || !sid) return;
    fetch(`/api/notes?storySetId=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isLoggedIn, sid]);

  // Load starred bullets for this story set
  useEffect(() => {
    if (!isLoggedIn || !storySetId) return;
    fetch(`/api/stars?storySetId=${encodeURIComponent(storySetId)}`)
      .then((r) => r.json())
      .then((data: StarredKey[]) => {
        if (Array.isArray(data)) {
          setStarred(new Set(data.map((s) => starKey(s.cardIndex, s.bulletIndex))));
        }
      })
      .catch(() => {});
  }, [isLoggedIn, storySetId]);

  // Restore reading progress for saved stories
  useEffect(() => {
    if (!storySetId) return;
    try {
      const saved = localStorage.getItem(`storis_progress_${storySetId}`);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx > 0 && idx < total) {
          setCardIndex(idx);
          setResumed(true);
          setTimeout(() => setResumed(false), 2500);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storySetId]);

  // Persist progress on every card change
  useEffect(() => {
    if (!storySetId) return;
    try { localStorage.setItem(`storis_progress_${storySetId}`, String(cardIndex)); } catch {}
  }, [storySetId, cardIndex]);

  const cardNotes = notes.filter((n) => n.card_index === cardIndex);

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  function openEditNote(note: Note) {
    setEditingNoteId(note.id);
    setNoteText(note.content);
    setShowNoteInput(true);
  }

  function cancelNote() {
    setShowNoteInput(false);
    setNoteText("");
    setEditingNoteId(null);
  }

  async function saveNote() {
    if (!noteText.trim() || !isLoggedIn || savingNote) return;
    setSavingNote(true);
    try {
      // If editing, delete the old note first then re-create
      if (editingNoteId) {
        await fetch("/api/notes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingNoteId }),
        });
        setNotes((prev) => prev.filter((n) => n.id !== editingNoteId));
        setEditingNoteId(null);
      }
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

  async function toggleStar(bulletIndex: number) {
    if (!isLoggedIn || !storySetId) return;
    const key = starKey(cardIndex, bulletIndex);
    if (togglingBullet === key) return;
    setTogglingBullet(key);
    const isStarred = starred.has(key);
    try {
      if (isStarred) {
        await fetch("/api/stars", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storySetId, cardIndex, bulletIndex }),
        });
        setStarred((prev) => { const next = new Set(prev); next.delete(key); return next; });
      } else {
        await fetch("/api/stars", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storySetId, storyTitle: set.title, cardIndex, bulletIndex, bulletText: card.bullets[bulletIndex] }),
        });
        setStarred((prev) => new Set([...prev, key]));
      }
    } catch { /* silent */ } finally {
      setTogglingBullet(null);
    }
  }

  async function flyOff(dir: 1 | -1, dest = "/") {
    if (flying.current) return;
    flying.current = true;
    await animate(x, dir * 1400, { duration: 0.32, ease: [0.32, 0, 0.67, 0] });
    window.location.href = dest;
  }

  function recordInteraction(action: "like" | "dislike") {
    fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: set.id, storyTitle: set.title, storySource: set.source, action }),
    }).catch(() => {});
  }

  // After sign-in completes, auto-save the pending story and navigate to /space
  useEffect(() => {
    if (!isLoggedIn || !pendingSave) return;
    setPendingSave(false);
    (async () => {
      addToCurate(set);
      recordInteraction("like");
      if (!storySetId) {
        await fetch("/api/space", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(set),
        }).catch(() => {});
      }
      flyOff(1, "/space");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, pendingSave]);

  async function handleLike() {
    if (!isLoaded) return;

    if (!isLoggedIn) {
      // Open Clerk modal; pendingSave triggers auto-save once they sign in
      setPendingSave(true);
      openSignIn();
      return;
    }

    addToCurate(set);
    recordInteraction("like");
    // Persist to DB before navigating — navigation cancels in-flight fetches
    if (!storySetId) {
      await fetch("/api/space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(set),
      }).catch(() => {});
    }
    flyOff(1, "/space");
  }
  function handleNope() { recordDislike(set.id); recordInteraction("dislike"); flyOff(-1, "/"); }
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
    if (showNoteInput) { cancelNote(); return; }
    x.set(0);
    const rect = e.currentTarget.getBoundingClientRect();
    const tappedLeft = e.clientX - rect.left < rect.width / 2;
    if (tappedLeft) { if (!isFirst) setCardIndex((i) => i - 1); }
    else { setCardIndex(isLast ? 0 : (i) => i + 1); }
  }

  void theme;

  const [copied, setCopied] = useState(false);
  async function shareStory() {
    const url = `${window.location.origin}/stories/${sid}`;
    if (navigator.share) {
      navigator.share({ title: set.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--lp-bg)",
      userSelect: "none",
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingBottom: isLoggedIn
        ? "calc(72px + env(safe-area-inset-bottom, 0px))"
        : "env(safe-area-inset-bottom, 0px)",
      boxSizing: "border-box",
    }}>

      {/* Card */}
      <div style={{ flex: 1, position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 0 }}>

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
          {/* Cover image */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${coverImg})`, backgroundSize: "cover", backgroundPosition: "center top" }} />
          {/* Dark gradient */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.32) 42%, rgba(0,0,0,0.92) 100%)" }} />
          {/* Subtle color tint per card */}
          <div style={{ position: "absolute", inset: 0, background: gradient, opacity: 0.18 }} />

          {/* Progress bars */}
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, zIndex: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {set.cards.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= cardIndex ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.22)", transition: "background .3s" }} />
              ))}
            </div>
            {resumed && (
              <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                <span style={{ ...SG, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.12)", padding: "3px 10px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
                  ↩ Resumed from card {cardIndex + 1}
                </span>
              </div>
            )}
          </div>

          {/* SAVE stamp */}
          <motion.div style={{ opacity: likeOpacity, position: "absolute", top: 72, left: 20, zIndex: 20, border: "3px solid #34D399", borderRadius: 10, padding: "6px 16px", transform: "rotate(-18deg)", pointerEvents: "none", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(6px)" }}>
            <span style={{ ...SG, color: "#34D399", fontWeight: 900, fontSize: 26, letterSpacing: ".1em" }}>SAVE</span>
          </motion.div>
          {/* SKIP stamp */}
          <motion.div style={{ opacity: nopeOpacity, position: "absolute", top: 72, right: 20, zIndex: 20, border: "3px solid #FF6B81", borderRadius: 10, padding: "6px 16px", transform: "rotate(18deg)", pointerEvents: "none", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(6px)" }}>
            <span style={{ ...SG, color: "#FF6B81", fontWeight: 900, fontSize: 26, letterSpacing: ".1em" }}>SKIP</span>
          </motion.div>

          {/* Bottom content */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent 0%, rgba(0,0,0,0.52) 26%, rgba(0,0,0,0.92) 100%)", padding: "90px 20px 22px", zIndex: 10 }}>

            {/* Notes list */}
            {cardNotes.length > 0 && !showNoteInput && (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                {cardNotes.map((note) => (
                  <div key={note.id} style={{ background: "rgba(255,220,80,0.1)", border: "1px solid rgba(255,220,80,0.22)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <p onClick={() => openEditNote(note)} style={{ margin: 0, fontSize: 12, color: "rgba(255,220,80,0.9)", lineHeight: 1.5, flex: 1, cursor: "text" }}>✎ {note.content}</p>
                    <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: "rgba(255,220,80,0.3)", cursor: "pointer", padding: "1px 0 0", fontSize: 14, lineHeight: 1, flexShrink: 0 }} aria-label="Delete note">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Note input */}
            {showNoteInput && (
              <div style={{ marginBottom: 14 }} onClick={(e) => e.stopPropagation()}>
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note for this card…"
                  rows={2}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 10, color: "white", fontSize: 16, padding: "10px 12px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } if (e.key === "Escape") cancelNote(); }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={saveNote} disabled={savingNote || !noteText.trim()} style={{ ...SG, flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "rgba(255,220,80,0.85)", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: savingNote ? 0.6 : 1 }}>
                    {savingNote ? "Saving…" : editingNoteId ? "Update note" : "Save note"}
                  </button>
                  <button onClick={cancelNote} style={{ ...SG, padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Source + notes count */}
            <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...SG, fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 999, backdropFilter: "blur(8px)" }}>
                {set.source}
              </span>
              {cardNotes.length > 0 && (
                <span style={{ ...SG, fontSize: 10, fontWeight: 700, color: "rgba(255,220,80,0.85)", background: "rgba(255,220,80,0.12)", padding: "4px 8px", borderRadius: 999 }}>✎ {cardNotes.length}</span>
              )}
            </div>

            {/* Headline */}
            <h2 style={{ ...SG, fontSize: "clamp(20px,5.5vw,30px)", fontWeight: 800, color: "white", lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 13px" }}>
              {card.headline}
            </h2>

            {/* Bullets */}
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {(card.bullets ?? []).map((b, i) => {
                const key = starKey(cardIndex, i);
                const isStarred = starred.has(key);
                return (
                  <li key={i} style={{ display: "flex", gap: 9, color: "rgba(255,255,255,0.76)", fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.5, alignItems: "flex-start" }}>
                    <span style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0, marginTop: 2 }}>—</span>
                    <span style={{ flex: 1 }}>{b}</span>
                    {isLoggedIn && storySetId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(i); }}
                        aria-label={isStarred ? "Unstar" : "Star"}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0 0", flexShrink: 0, fontSize: 15, color: isStarred ? "#FBBF24" : "rgba(255,255,255,0.18)", transition: "color .15s", opacity: togglingBullet === key ? 0.5 : 1 }}
                      >
                        {isStarred ? "★" : "☆"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Read time + card count */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13, paddingTop: 11, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{card.readTime} read</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {isFirst ? "tap → to advance" : isLast ? "tap → to restart" : `${cardIndex + 1} / ${total}`}
              </span>
            </div>

            {/* Guest sign-in nudge on last card */}
            {isLast && isLoaded && !isLoggedIn && (
              <div
                style={{ margin: "12px 0 0", padding: "13px 16px", background: "rgba(124,92,255,0.16)", border: "1px solid rgba(124,92,255,0.32)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, backdropFilter: "blur(8px)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <p style={{ ...SG, margin: 0, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>Save this story</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>Sign in to build your library — it&apos;s free</p>
                </div>
                <SignInButton mode="modal">
                  <button style={{ ...SG, flexShrink: 0, padding: "9px 16px", borderRadius: 10, border: "none", background: "#7C5CFF", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px -4px rgba(124,92,255,0.7)" }}>
                    Sign in
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top floating bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 14px 0", pointerEvents: "none" }}>
          <button
            onClick={() => { window.location.href = storySetId ? "/space" : (isLoggedIn ? "/foryou" : "/"); }}
            style={{ pointerEvents: "auto", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.28)", border: "none", color: "rgba(255,255,255,0.88)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {storySetId && (
              <button onClick={shareStory} aria-label="Share" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.28)", border: "none", color: copied ? "#34D399" : "rgba(255,255,255,0.88)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", transition: "color .2s" }}>
                {copied
                  ? <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                  : <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                }
              </button>
            )}
            {set.sourceUrl && (
              <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ ...SG, color: "rgba(255,255,255,0.8)", fontSize: 11, textDecoration: "none", fontWeight: 700, background: "rgba(0,0,0,0.28)", padding: "6px 11px", borderRadius: 20, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
                Source ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — outside the card, below it */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "14px 32px 16px", background: "var(--lp-bg)" }}>

        {/* Skip */}
        <button
          onClick={handleNope}
          style={{ width: 56, height: 56, borderRadius: "50%", border: "none", background: "var(--lp-surface)", color: "#FF6B81", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 12px -2px rgba(0,0,0,0.15)", transition: "transform .15s, box-shadow .15s", flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 6px 20px -4px rgba(255,107,129,0.45)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px -2px rgba(0,0,0,0.15)"; }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        {/* Note (logged-in only) */}
        {isLoggedIn && (
          <button
            onClick={() => setShowNoteInput((v) => !v)}
            style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: showNoteInput ? "rgba(255,220,80,0.18)" : "var(--lp-surface)", color: "rgba(255,220,80,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 12px -2px rgba(0,0,0,0.15)", transition: "transform .15s", flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        )}

        {/* Save — primary, larger */}
        <button
          onClick={handleLike}
          style={{ width: 68, height: 68, borderRadius: "50%", border: "none", background: "var(--lp-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 6px 20px -4px var(--lp-glow)", transition: "transform .15s, box-shadow .15s", flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 10px 28px -4px var(--lp-glow)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 6px 20px -4px var(--lp-glow)"; }}
        >
          <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z"/></svg>
        </button>
      </div>

      {isLoggedIn && <BottomNav />}
    </div>
  );
}
