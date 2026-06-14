export const runtime = "nodejs";
export const maxDuration = 60;

import { auth } from "@clerk/nextjs/server";
import { getUserInterests } from "@/lib/db";
import { getOrGenerateDiscoverStories } from "@/lib/discover";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const categories = category
    ? [category]
    : await getUserInterests(userId);

  if (!categories.length) return Response.json({ stories: [] });

  const stories = await getOrGenerateDiscoverStories(categories);
  return Response.json({ stories }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=3600" },
  });
}
