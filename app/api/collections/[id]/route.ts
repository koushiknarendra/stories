import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addToCollection, removeFromCollection, deleteCollection, getCollectionItems } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Props) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const items = await getCollectionItems(id, userId);
  return NextResponse.json(items);
}

export async function POST(request: Request, { params }: Props) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { storySetId } = await request.json().catch(() => ({}));
  if (!storySetId) return NextResponse.json({ error: "storySetId required" }, { status: 400 });
  await addToCollection(userId, id, storySetId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Props) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body?.storySetId) {
    await removeFromCollection(id, body.storySetId, userId);
  } else {
    await deleteCollection(id, userId);
  }
  return NextResponse.json({ ok: true });
}
