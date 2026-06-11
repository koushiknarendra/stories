"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurate, removeFromCurate, saveCurrent } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeProvider";
import type { StorySet } from "@/lib/types";

export default function CuratePage() {
  const router = useRouter();
  const [sets, setSets] = useState<StorySet[]>([]);

  useEffect(() => {
    setSets(getCurate());
  }, []);

  function handleOpen(set: StorySet) {
    saveCurrent(set);
    router.push("/stories");
  }

  function handleDelete(id: string) {
    removeFromCurate(id);
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors"
        >
          ← Home
        </button>
        <h1 className="text-zinc-900 dark:text-white font-semibold text-base">Saved Stories</h1>
        <ThemeToggle className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors" />
      </div>

      <div className="flex-1 px-5 pb-10">
        {sets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">No saved stories yet</p>
            <button
              onClick={() => router.push("/")}
              className="text-zinc-900 dark:text-white text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-5 py-2.5 rounded-xl transition-colors"
            >
              Add your first source
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-w-lg mx-auto">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4"
              >
                <button
                  onClick={() => handleOpen(set)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-zinc-900 dark:text-white font-medium text-sm truncate">{set.title}</p>
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-0.5">
                    {set.cards.length} cards ·{" "}
                    {new Date(set.savedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(set.id)}
                  className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 transition-colors text-sm shrink-0 px-2 py-1"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
