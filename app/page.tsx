"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveCurrent } from "@/lib/storage";
import { ThemeToggle } from "@/components/ThemeProvider";
import type { StorySet } from "@/lib/types";

type Mode = "url" | "pdf" | "text";

const STATUS_MESSAGES = [
  "Reading the source…",
  "Identifying key ideas…",
  "Crafting your story cards…",
  "Almost there…",
];

function SkeletonCard({ opacity }: { opacity: number }) {
  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5"
      style={{ opacity }}
    >
      <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4 mb-4 animate-pulse" />
      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2 animate-pulse" />
      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-5 animate-pulse" />
      <div className="space-y-2.5">
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-full animate-pulse" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );
}

function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const intervals = [3000, 4000, 5000];
    let step = 0;
    function tick() {
      step++;
      setMsgIndex(Math.min(step, STATUS_MESSAGES.length - 1));
      if (step < STATUS_MESSAGES.length - 1) {
        setTimeout(tick, intervals[step] ?? 4000);
      }
    }
    const t = setTimeout(tick, intervals[0]);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full max-w-lg space-y-3">
      <p className="text-center text-zinc-900 dark:text-white text-sm font-medium mb-6 h-5 transition-all">
        {STATUS_MESSAGES[msgIndex]}
      </p>
      <SkeletonCard opacity={1} />
      <SkeletonCard opacity={0.6} />
      <SkeletonCard opacity={0.3} />
    </div>
  );
}

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const autoTriggered = useRef(false);

  const generate = useCallback(async (targetUrl: string) => {
    setError("");
    setLoading(true);
    try {
      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error ?? "Parse failed");

      const storiesRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseData),
      });
      const storiesText = await storiesRes.text();
      let storiesData: Record<string, unknown>;
      try { storiesData = JSON.parse(storiesText); } catch { throw new Error(`Server error (${storiesRes.status})`); }
      if (!storiesRes.ok) throw new Error((storiesData.error as string) ?? "Generation failed");

      const storySet: StorySet = {
        id: crypto.randomUUID(),
        title: storiesData.title as string,
        source: storiesData.source as string,
        sourceUrl: storiesData.sourceUrl as string | undefined,
        cards: storiesData.cards as StorySet["cards"],
        savedAt: new Date().toISOString(),
      };
      saveCurrent(storySet);
      router.push("/stories");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const incomingUrl = searchParams.get("url");
    if (incomingUrl && !autoTriggered.current) {
      autoTriggered.current = true;
      setUrl(incomingUrl);
      generate(incomingUrl);
    }
  }, [searchParams, generate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "url") { generate(url); return; }
    setError("");
    setLoading(true);
    try {
      let parseRes: Response;
      if (mode === "pdf" && file) {
        const fd = new FormData();
        fd.append("file", file);
        parseRes = await fetch("/api/parse", { method: "POST", body: fd });
      } else {
        parseRes = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: pastedText }),
        });
      }
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error ?? "Parse failed");

      const storiesRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseData),
      });
      const storiesText = await storiesRes.text();
      let storiesData: Record<string, unknown>;
      try { storiesData = JSON.parse(storiesText); } catch { throw new Error(`Server error (${storiesRes.status})`); }
      if (!storiesRes.ok) throw new Error((storiesData.error as string) ?? "Generation failed");

      const storySet: StorySet = {
        id: crypto.randomUUID(),
        title: storiesData.title as string,
        source: storiesData.source as string,
        sourceUrl: storiesData.sourceUrl as string | undefined,
        cards: storiesData.cards as StorySet["cards"],
        savedAt: new Date().toISOString(),
      };
      saveCurrent(storySet);
      router.push("/stories");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "url", label: "URL" },
    { id: "pdf", label: "PDF" },
    { id: "text", label: "Paste text" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-10 text-center relative">
          <ThemeToggle className="absolute right-0 top-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-base transition-colors" />
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">Stories</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-base">
            Turn any article or PDF into swipeable story cards
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg dark:shadow-xl border border-zinc-200 dark:border-zinc-800">
          {/* tabs */}
          <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === tab.id
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "url" && (
              <input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                autoFocus
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20"
              />
            )}

            {mode === "pdf" && (
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-8 text-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <p className="text-zinc-900 dark:text-white text-sm font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-zinc-600 dark:text-zinc-300 text-sm font-medium">Click to upload PDF</p>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Max 20 MB</p>
                  </>
                )}
              </div>
            )}

            {mode === "text" && (
              <textarea
                placeholder="Paste your article or document text here…"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                required
                rows={6}
                autoFocus
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl px-4 py-3 text-sm placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 resize-none"
              />
            )}

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold py-3 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-[0.98] transition-all text-sm"
            >
              Generate Stories
            </button>
          </form>
        </div>

        <div className="mt-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-center">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold tracking-wider uppercase mb-1">Shortcut</p>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm">
            On any article, replace <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">https://</code> with <code className="bg-zinc-200 dark:bg-zinc-800 px-1 rounded">storis.in/</code>
          </p>
        </div>

        <p className="text-center mt-4 text-zinc-400 dark:text-zinc-500 text-sm">
          <a href="/curate" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">
            Saved stories →
          </a>
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
