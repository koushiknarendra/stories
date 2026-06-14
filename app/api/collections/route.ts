import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listCollections, createCollection } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collections = await listCollections(userId);
  return NextResponse.json(collections);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await request.json().catch(() => ({}));
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }
  const collection = await createCollection(userId, name.trim().slice(0, 50));
  return NextResponse.json(collection, { status: 201 });
}
