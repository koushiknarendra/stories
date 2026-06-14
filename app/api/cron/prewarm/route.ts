export const runtime = "nodejs";
export const maxDuration = 300;

import { CATEGORIES } from "@/lib/categories";
import { getOrGenerateDiscoverStories } from "@/lib/discover";

// Called nightly by Vercel cron to pre-warm all category caches before morning traffic.
// CRON_SECRET is auto-injected by Vercel into every cron request's Authorization header.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allKeys = CATEGORIES.map((c) => c.key);
  const summary: Record<string, number> = {};

  // Process 3 categories at a time — each triggers up to 2 Jina fetches + 2 Claude calls.
  // Batching avoids hammering Jina with 20 simultaneous requests.
  for (let i = 0; i < allKeys.length; i += 3) {
    const batch = allKeys.slice(i, i + 3);
    await Promise.all(
      batch.map(async (category) => {
        try {
          const stories = await getOrGenerateDiscoverStories([category]);
          summary[category] = stories.length;
        } catch {
          summary[category] = 0;
        }
      })
    );
  }

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  return Response.json({ ok: true, summary, total });
}
