import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { starBullet, unstarBullet, listStarredForStory, listStarredBullets } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storySetId = req.nextUrl.searchParams.get("storySetId");
  const all = req.nextUrl.searchParams.get("all");

  if (all) {
    const bullets = await listStarredBullets(userId);
    return NextResponse.json(bullets);
  }

  if (!storySetId) return NextResponse.json({ error: "storySetId required" }, { status: 400 });
  const bullets = await listStarredForStory(userId, storySetId);
  return NextResponse.json(bullets);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storySetId, storyTitle, cardIndex, bulletIndex, bulletText } = await req.json();
  if (!storySetId || cardIndex == null || bulletIndex == null || !bulletText)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const row = await starBullet(userId, storySetId, storyTitle ?? "", cardIndex, bulletIndex, bulletText);
  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { storySetId, cardIndex, bulletIndex } = await req.json();
  if (!storySetId || cardIndex == null || bulletIndex == null)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await unstarBullet(userId, storySetId, cardIndex, bulletIndex);
  return NextResponse.json({ ok: true });
}
