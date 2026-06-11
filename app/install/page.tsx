"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";

const BOOKMARKLET = `javascript:window.location.href='https://storis.in/?url='+encodeURIComponent(location.href)`;

export default function InstallPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <button
          onClick={() => router.push("/")}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors"
        >
          ← Home
        </button>
        <ThemeToggle className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm text-center">

          {/* Heading */}
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3">
            Read anything as stories
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-base mb-12">
            Add Storis to your bookmarks bar. One click turns any article into swipeable cards.
          </p>

          {/* Steps */}
          <div className="space-y-8 text-left mb-12">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white dark:text-zinc-900 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white font-semibold mb-3">
                  Drag this to your bookmarks bar
                </p>
                {/* Draggable bookmarklet */}
                <a
                  href={BOOKMARKLET}
                  onClick={(e) => e.preventDefault()}
                  draggable
                  className="inline-flex items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-zinc-900 dark:text-white font-semibold px-5 py-3 rounded-2xl cursor-grab active:cursor-grabbing transition-all shadow-md select-none"
                >
                  <span className="text-lg">📖</span>
                  Storis
                </a>
                <p className="text-zinc-400 dark:text-zinc-600 text-xs mt-2">
                  Hold and drag the button above to your bookmarks bar
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white dark:text-zinc-900 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white font-semibold">
                  Go to any article you want to read
                </p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
                  Works on any news site, blog, or publication
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white dark:text-zinc-900 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-zinc-900 dark:text-white font-semibold">
                  Click Storis in your bookmarks bar
                </p>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
                  Cards appear in seconds
                </p>
              </div>
            </div>
          </div>

          {/* Mobile note */}
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-left">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-wider uppercase mb-2">On mobile?</p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Bookmark this page, then edit the bookmark and replace the URL with the text below.
            </p>
            <div className="mt-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 break-all">
              <code className="text-zinc-700 dark:text-zinc-300 text-xs">
                {BOOKMARKLET}
              </code>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
