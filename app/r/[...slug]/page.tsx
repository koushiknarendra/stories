import { Suspense } from "react";
import { getStoriesForUrl, reconstructUrl } from "@/lib/getStories";
import StoryReader from "@/components/StoryReader";

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-white text-sm font-medium mb-6 animate-pulse">
          Crafting your story cards…
        </p>
        {[1, 0.6, 0.3].map((opacity, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            style={{ opacity }}
          >
            <div className="h-2.5 bg-zinc-800 rounded w-1/4 mb-4 animate-pulse" />
            <div className="h-5 bg-zinc-700 rounded w-3/4 mb-2 animate-pulse" />
            <div className="h-5 bg-zinc-700 rounded w-1/2 mb-5 animate-pulse" />
            <div className="space-y-2.5">
              <div className="h-3 bg-zinc-800 rounded w-full animate-pulse" />
              <div className="h-3 bg-zinc-800 rounded w-5/6 animate-pulse" />
              <div className="h-3 bg-zinc-800 rounded w-4/6 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function StoryContent({ url }: { url: string }) {
  const set = await getStoriesForUrl(url);
  return <StoryReader set={set} />;
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const url = reconstructUrl(slug);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <StoryContent url={url} />
    </Suspense>
  );
}
