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
  const { theme, toggle } = useTheme();
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

  const btnBg = theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)";

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
    <div style={{ height: "100dvh", position: "relative", overflow: "hidden", userSelect: "none", background: "#000" }}>

      {/* Full-screen card */}
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
          {/* Background: article hero image with dark overlay, or solid gradient */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${coverImg})`, backgroundSize: "cover", backgroundPosition: "center top" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.88) 100%)" }} />
          {/* Subtle gradient color tint for visual variety across cards */}
          <div style={{ position: "absolute", inset: 0, background: gradient, opacity: 0.22 }} />

          {/* Progress bars — sit above the floating nav buttons */}
          <div style={{ position: "absolute", top: 14, left: 14, right: 14, zIndex: 10 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {set.cards.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= cardIndex ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "background .3s" }} />
              ))}
            </div>
            {resumed && (
              <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
                <span style={{ ...SG, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.12)", padding: "3px 10px", borderRadius: 999, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                  ↩ Resumed from card {cardIndex + 1}
                </span>
              </div>
            )}
          </div>

          {/* Source chip + note indicator — below the floating nav */}
          <div style={{ position: "absolute", top: 96, left: 16, right: 16, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...SG, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", padding: "5px 12px", borderRadius: 999, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
              {set.source}
            </span>
            {cardNotes.length > 0 && (
              <span style={{ ...SG, fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: "rgba(255,220,80,0.9)", background: "rgba(255,220,80,0.15)", padding: "5px 10px", borderRadius: 999, backdropFilter: "blur(10px)" }}>
                ✎ {cardNotes.length} note{cardNotes.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

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
                  <div
                    key={note.id}
                    style={{ background: "rgba(255,220,80,0.12)", border: "1px solid rgba(255,220,80,0.25)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}
                  >
                    <p onClick={() => openEditNote(note)} style={{ margin: 0, fontSize: 12, color: "rgba(255,220,80,0.9)", lineHeight: 1.5, flex: 1, cursor: "text" }}>✎ {note.content}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{ background: "none", border: "none", color: "rgba(255,220,80,0.35)", cursor: "pointer", padding: "1px 0 0", fontSize: 14, lineHeight: 1, flexShrink: 0 }}
                      aria-label="Delete note"
                    >✕</button>
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
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "white", fontSize: 16, padding: "10px 12px", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(); } if (e.key === "Escape") cancelNote(); }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button onClick={saveNote} disabled={savingNote || !noteText.trim()} style={{ ...SG, flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "rgba(255,220,80,0.85)", color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: savingNote ? 0.6 : 1 }}>
                    {savingNote ? "Saving…" : editingNoteId ? "Update note" : "Save note"}
                  </button>
                  <button onClick={cancelNote} style={{ ...SG, padding: "8px 14px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
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
              {(card.bullets ?? []).map((b, i) => {
                const key = starKey(cardIndex, i);
                const isStarred = starred.has(key);
                return (
                  <li key={i} style={{ display: "flex", gap: 10, color: "rgba(255,255,255,0.8)", fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.55, alignItems: "flex-start" }}>
                    <span style={{ color: "rgba(255,255,255,0.32)", flexShrink: 0, marginTop: 2 }}>—</span>
                    <span style={{ flex: 1 }}>{b}</span>
                    {isLoggedIn && storySetId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(i); }}
                        aria-label={isStarred ? "Unstar" : "Star this insight"}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0 0", flexShrink: 0, fontSize: 15, color: isStarred ? "#FBBF24" : "rgba(255,255,255,0.2)", transition: "color .15s", opacity: togglingBullet === key ? 0.5 : 1 }}
                      >
                        {isStarred ? "★" : "☆"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Progress + read time */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: ".04em" }}>{card.readTime} read</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                {isFirst ? "tap right to advance" : isLast ? "tap right to restart" : `${cardIndex + 1} / ${total}`}
              </span>
            </div>

            {/* Sign-in nudge on last card for guests */}
            {isLast && isLoaded && !isLoggedIn && (
              <div
                style={{ margin: "14px 0 4px", padding: "14px 16px", background: "rgba(124,92,255,0.18)", border: "1px solid rgba(124,92,255,0.35)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, backdropFilter: "blur(8px)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <p style={{ ...SG, margin: 0, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.35 }}>Save this story</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>Sign in to build your library — it&apos;s free</p>
                </div>
                <SignInButton mode="modal">
                  <button style={{ ...SG, flexShrink: 0, padding: "9px 16px", borderRadius: 10, border: "none", background: "#7C5CFF", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px -4px rgba(124,92,255,0.7)" }}>
                    Sign in
                  </button>
                </SignInButton>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, padding: "22px 0 44px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {cardNotes.length === 0 && (
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
              )}

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

      {/* Top bar — floats over the card */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 18px 10px", pointerEvents: "none" }}>
        <button
          onClick={() => { window.location.href = storySetId ? "/space" : (isLoggedIn ? "/space" : "/"); }}
          style={{ pointerEvents: "auto", width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.35)", border: "none", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          ✕
        </button>
        <span style={{ ...SG, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {set.title}
        </span>
        <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {storySetId && (
            <button
              onClick={shareStory}
              aria-label="Share"
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.35)", border: "none", color: copied ? "rgba(52,211,153,0.9)" : "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transition: "color .2s" }}
            >
              {copied
                ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              }
            </button>
          )}
          {set.sourceUrl && (
            <a href={set.sourceUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...SG, color: "rgba(255,255,255,0.75)", fontSize: 11, textDecoration: "none", fontWeight: 700, background: "rgba(0,0,0,0.35)", padding: "6px 10px", borderRadius: 20, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
              Source ↗
            </a>
          )}
        </div>
      </div>

    </div>
  );
}
