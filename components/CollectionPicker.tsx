"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SG: React.CSSProperties = { fontFamily: "var(--font-space, 'Space Grotesk', sans-serif)" };

interface Collection {
  id: string;
  name: string;
  item_count: number;
  cover_images: string[];
}

const BLOCK_COLORS = [
  { bg: "rgba(124,92,255,0.14)", mid: "rgba(124,92,255,0.22)", border: "rgba(124,92,255,0.38)", accent: "#7C5CFF" },
  { bg: "rgba(52,211,153,0.12)", mid: "rgba(52,211,153,0.20)", border: "rgba(52,211,153,0.36)", accent: "#34D399" },
  { bg: "rgba(251,146,60,0.12)", mid: "rgba(251,146,60,0.20)", border: "rgba(251,146,60,0.36)", accent: "#FB923C" },
  { bg: "rgba(244,114,182,0.12)", mid: "rgba(244,114,182,0.20)", border: "rgba(244,114,182,0.36)", accent: "#F472B6" },
  { bg: "rgba(96,165,250,0.12)", mid: "rgba(96,165,250,0.20)", border: "rgba(96,165,250,0.36)", accent: "#60A5FA" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collectionId?: string) => Promise<void>;
  storyTitle: string;
}

export default function CollectionPicker({ isOpen, onClose, onSave, storyTitle }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/collections")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCollections(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 60);
  }, [creating]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const col = await res.json();
    const newCol = { ...col, item_count: 0, cover_images: [] };
    setCollections((prev) => [newCol, ...prev]);
    setNewName("");
    setCreating(false);
    handlePickCollection(col.id);
  }

  async function handlePickCollection(id: string) {
    if (saving) return;
    setSaving(id);
    await onSave(id);
  }

  async function handleQuickSave() {
    if (saving) return;
    setSaving("__quick__");
    await onSave(undefined);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101, background: "var(--lp-bg)", borderRadius: "22px 22px 0 0", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", maxHeight: "82vh", overflowY: "auto" }}
          >
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 6px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--lp-border)" }} />
            </div>

            {/* Header */}
            <div style={{ padding: "8px 20px 16px" }}>
              <p style={{ ...SG, fontSize: 18, fontWeight: 700, color: "var(--lp-text)", margin: "0 0 3px" }}>Save to…</p>
              <p style={{ fontSize: 12, color: "var(--lp-text3)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{storyTitle}</p>
            </div>

            {/* Quick save */}
            <div style={{ padding: "0 20px 16px" }}>
              <button
                onClick={handleQuickSave}
                disabled={!!saving}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1.5px solid var(--lp-border)", background: "var(--lp-glass-surface)", cursor: saving ? "wait" : "pointer", color: "var(--lp-text)", textAlign: "left", opacity: saving && saving !== "__quick__" ? 0.5 : 1, transition: "opacity .15s" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {saving === "__quick__"
                    ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(52,211,153,0.3)", borderTopColor: "#34D399", animation: "spin .7s linear infinite" }} />
                    : <svg width={20} height={20} viewBox="0 0 24 24" fill="#34D399"><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z"/></svg>
                  }
                </div>
                <div>
                  <p style={{ ...SG, fontWeight: 600, fontSize: 14, color: "var(--lp-text)", margin: "0 0 2px" }}>Save to Library</p>
                  <p style={{ fontSize: 12, color: "var(--lp-text3)", margin: 0 }}>No collection, just save it</p>
                </div>
              </button>
            </div>

            {/* Divider + label */}
            <div style={{ margin: "0 20px 14px", height: 1, background: "var(--lp-border)" }} />
            <p style={{ ...SG, padding: "0 20px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--lp-text3)", margin: "0 0 14px" }}>Collections</p>

            {/* Collections grid */}
            <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {loading && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "24px 0", color: "var(--lp-text3)", fontSize: 13 }}>Loading…</div>
              )}
              {!loading && collections.map((col, idx) => {
                const palette = BLOCK_COLORS[idx % BLOCK_COLORS.length];
                return (
                  <button
                    key={col.id}
                    onClick={() => handlePickCollection(col.id)}
                    disabled={!!saving}
                    style={{ display: "flex", flexDirection: "column", gap: 8, background: "none", border: "none", cursor: saving ? "wait" : "pointer", padding: 0, textAlign: "left", opacity: saving && saving !== col.id ? 0.5 : 1, transition: "opacity .15s" }}
                  >
                    {/* Stacked blocks */}
                    <div style={{ position: "relative", aspectRatio: "4/3", width: "100%" }}>
                      <div style={{ position: "absolute", top: 8, left: 4, right: 4, bottom: -3, background: palette.bg, border: `1px solid ${palette.border}`, borderRadius: 12, transform: "rotate(-6deg)", zIndex: 1 }} />
                      <div style={{ position: "absolute", top: 4, left: 2, right: 2, bottom: -1, background: palette.mid, border: `1px solid ${palette.border}`, borderRadius: 13, transform: "rotate(-2.5deg)", zIndex: 2 }} />
                      <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden", background: palette.bg, border: `1.5px solid ${palette.border}`, zIndex: 3 }}>
                        {col.cover_images.length > 0 ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", height: "100%", gap: 2 }}>
                            {[0, 1, 2, 3].map((i) =>
                              col.cover_images[i] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={col.cover_images[i]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              ) : (
                                <div key={i} style={{ background: palette.bg }} />
                              )
                            )}
                          </div>
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width={28} height={28} viewBox="0 0 24 24" fill={palette.accent} opacity={0.45}><path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4.5L4 21V5a2 2 0 0 1 2-2z"/></svg>
                          </div>
                        )}
                        {saving === col.id && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p style={{ ...SG, fontSize: 13, fontWeight: 600, color: "var(--lp-text)", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{col.name}</p>
                      <p style={{ fontSize: 11, color: "var(--lp-text3)", margin: 0 }}>{col.item_count} {col.item_count === 1 ? "story" : "stories"}</p>
                    </div>
                  </button>
                );
              })}

              {/* New collection button or input */}
              {creating ? (
                <div style={{ display: "flex", gap: 8, gridColumn: "1 / -1", alignItems: "center" }}>
                  <input
                    ref={inputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") { setCreating(false); setNewName(""); }
                    }}
                    placeholder="Collection name"
                    maxLength={50}
                    style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: "1.5px solid var(--lp-accent)", background: "var(--lp-glass-surface)", color: "var(--lp-text)", fontSize: 14, outline: "none", fontFamily: "inherit" }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    style={{ ...SG, padding: "11px 16px", borderRadius: 12, border: "none", background: "var(--lp-accent)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: newName.trim() ? "pointer" : "not-allowed", opacity: newName.trim() ? 1 : 0.5, flexShrink: 0 }}
                  >
                    Create
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  style={{ aspectRatio: "4/3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, border: "1.5px dashed var(--lp-border)", background: "transparent", cursor: "pointer", color: "var(--lp-text3)" }}
                >
                  <span style={{ fontSize: 26, lineHeight: 1, color: "var(--lp-text2)" }}>+</span>
                  <span style={{ ...SG, fontSize: 12, fontWeight: 600 }}>New collection</span>
                </button>
              )}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
