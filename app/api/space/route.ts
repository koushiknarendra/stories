export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { listStorySets, saveStorySet, createInboxItem, markInboxItemDone } from "@/lib/db";
import type { StorySet } from "@/lib/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sets = await listStorySets(userId);
  return Response.json(sets);
}

// Called when user taps Save in the story reader (guest flow → logged-in save)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const set = await request.json() as StorySet;
  if (!set?.id || !set?.cards?.length) {
    return Response.json({ error: "Invalid story set" }, { status: 400 });
  }

  // Create a synthetic inbox item so it appears in the space list
  const item = await createInboxItem(userId, set.sourceUrl ?? null, set.source);
  await saveStorySet(userId, item.id, set, set.cards);
  await markInboxItemDone(item.id, set.title);

  return Response.json({ ok: true, id: set.id });
}
