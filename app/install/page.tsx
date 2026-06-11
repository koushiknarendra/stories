"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";

const BOOKMARKLET = `javascript:window.location.href='https://storis.in/'+location.href.replace(/^https?:\/\//,'')`;

export default function InstallPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
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
        <div className="w-full max-w-sm">

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
              One-click install
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Add Storis to your browser. Click it on any article.
            </p>
          </div>

          {/* The bookmarklet button */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
            <div className="flex justify-center mb-5">
              <a
                href={BOOKMARKLET}
                onClick={(e) => e.preventDefault()}
                draggable
                className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold px-6 py-3 rounded-2xl cursor-grab active:cursor-grabbing shadow-lg select-none text-base"
              >
                📖 Storis
              </a>
            </div>

            {/* Desktop instructions */}
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-zinc-400 dark:text-zinc-500 text-sm font-mono mt-0.5">1</span>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm">
                  <strong>Right-click</strong> the button above → <strong>"Bookmark this link"</strong>
                  <span className="text-zinc-400 dark:text-zinc-500"> (or "Save link" / "Add to favorites")</span>
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-zinc-400 dark:text-zinc-500 text-sm font-mono mt-0.5">2</span>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm">
                  Save it to your <strong>Bookmarks Bar</strong>
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-zinc-400 dark:text-zinc-500 text-sm font-mono mt-0.5">3</span>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm">
                  On any article, click <strong>📖 Storis</strong> in your bookmarks bar
                </p>
              </div>
            </div>

            <p className="text-zinc-400 dark:text-zinc-500 text-xs text-center mt-4">
              You can also drag the button to your bookmarks bar
            </p>
          </div>

          {/* Mobile section */}
          <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-wider uppercase mb-3">
              On iPhone / Android
            </p>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
              Create a bookmark manually, then replace its URL with:
            </p>
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 break-all">
              <code className="text-zinc-700 dark:text-zinc-300 text-xs select-all">
                {BOOKMARKLET}
              </code>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
