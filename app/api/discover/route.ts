export const runtime = "nodejs";
export const maxDuration = 60;

import { auth } from "@clerk/nextjs/server";
import { getUserInterests } from "@/lib/db";
import { getOrGenerateDiscoverStories } from "@/lib/discover";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const interests = await getUserInterests(userId);
  if (!interests.length) return Response.json({ stories: [] });

  const stories = await getOrGenerateDiscoverStories(interests);
  return Response.json({ stories });
}
