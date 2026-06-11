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

export default function StoryReader({ set }: { set: StorySet }) {
  const router = useRouter();
  const [cardIndex, setCardIndex] = useState(0);
  const dragged = useRef(false);
  const flying = useRef(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -30], [1, 0]);
  const cardScale = useTransform(x, [-260, 0, 260], [0.97, 1, 0.97]);

  const card = set.cards[cardIndex];
  const total = set.cards.length;
  const isLast = cardIndex === total - 1;

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

  function onDragStart() {
    dragged.current = false;
  }

  function onDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 6) dragged.current = true;
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      handleLike();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      handleNope();
    }
  }

  function handleClick() {
    if (dragged.current || flying.current) return;
    x.set(0);
    if (isLast) {
      router.push("/");
    } else {
      setCardIndex((i) => i + 1);
    }
  }

  return (
    <div className="h-[100dvh] bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2 shrink-0">
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          ✕
        </button>
        <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium tracking-wider uppercase truncate max-w-[180px]">
          {set.title}
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors" />
          {set.sourceUrl ? (
            <a
              href={set.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 dark:text-zinc-500 text-xs hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
            >
              Source ↗
            </a>
          ) : null}
        </div>
      </div>

      {/* Progress bars */}
      <div className="flex gap-1 px-5 py-3 shrink-0">
        {set.cards.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
              i <= cardIndex ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5 relative">
        {/* Background stack hint */}
        {!isLast && (
          <div className="absolute inset-x-9 top-3 bottom-0 bg-zinc-200/70 dark:bg-zinc-800/60 rounded-3xl -z-10 scale-[0.95]" />
        )}

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          style={{ x, rotate, scale: cardScale }}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          onClick={handleClick}
          className="w-full max-w-sm relative cursor-pointer touch-none"
        >
          {/* LIKE badge */}
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-7 left-6 z-10 border-[3px] border-green-500 rounded-xl px-3 py-1 -rotate-12 pointer-events-none"
          >
            <span className="text-green-500 font-black text-xl tracking-widest">LIKE</span>
          </motion.div>

          {/* NOPE badge */}
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-7 right-6 z-10 border-[3px] border-red-500 rounded-xl px-3 py-1 rotate-12 pointer-events-none"
          >
            <span className="text-red-500 font-black text-xl tracking-widest">NOPE</span>
          </motion.div>

          {/* Card body */}
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl overflow-hidden"
            style={{ minHeight: "62vh" }}
          >
            <div className="p-7 flex flex-col" style={{ minHeight: "62vh" }}>
              <div className="flex-1">
                <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-bold tracking-[0.18em] uppercase mb-5">
                  {set.source}
                </p>
                <h2 className="text-[1.65rem] font-bold text-zinc-900 dark:text-white leading-tight mb-7">
                  {card.headline}
                </h2>
                <ul className="space-y-4">
                  {card.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-zinc-600 dark:text-zinc-300 text-[0.875rem] leading-relaxed"
                    >
                      <span className="text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">—</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-zinc-400 dark:text-zinc-600 text-xs">{card.readTime} read</span>
                <span className="text-zinc-300 dark:text-zinc-700 text-xs">
                  {isLast ? "Last card · tap to finish" : `${cardIndex + 1} of ${total} · tap for next`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-14 pb-10 pt-5 shrink-0">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleNope}
            className="w-[60px] h-[60px] rounded-full border-2 border-red-400/30 dark:border-red-500/30 bg-white dark:bg-zinc-900 flex items-center justify-center hover:border-red-500/70 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-90 transition-all shadow-lg"
          >
            <span className="text-red-500 text-[22px] leading-none">✕</span>
          </button>
          <span className="text-zinc-400 dark:text-zinc-600 text-[10px] tracking-wide">Less of this</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleLike}
            className="w-[60px] h-[60px] rounded-full border-2 border-green-400/30 dark:border-green-500/30 bg-white dark:bg-zinc-900 flex items-center justify-center hover:border-green-500/70 hover:bg-green-50 dark:hover:bg-green-500/10 active:scale-90 transition-all shadow-lg"
          >
            <span className="text-green-500 text-[22px] leading-none">♥</span>
          </button>
          <span className="text-zinc-400 dark:text-zinc-600 text-[10px] tracking-wide">Like</span>
        </div>
      </div>
    </div>
  );
}
