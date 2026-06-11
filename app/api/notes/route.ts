export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { addNote, listNotes, deleteNote } from "@/lib/db";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const storySetId = searchParams.get("storySetId");
  if (!storySetId) return Response.json({ error: "storySetId required" }, { status: 400 });

  const notes = await listNotes(userId, storySetId);
  return Response.json(notes);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { storySetId, cardIndex, content } = await request.json();
  if (!storySetId || !content?.trim()) {
    return Response.json({ error: "storySetId and content required" }, { status: 400 });
  }

  const note = await addNote(userId, storySetId as string, cardIndex ?? null, (content as string).trim());
  return Response.json(note);
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await deleteNote(id as string, userId);
  return Response.json({ ok: true });
}
