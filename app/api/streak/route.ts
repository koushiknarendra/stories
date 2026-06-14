export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { getUserStreak, markStoryRead, updateUserStreak } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getUserStreak(userId), {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { storySetId } = await request.json();
  if (!storySetId) return Response.json({ error: "storySetId required" }, { status: 400 });
  await markStoryRead(userId, storySetId as string);
  await updateUserStreak(userId);
  return Response.json(await getUserStreak(userId));
}
