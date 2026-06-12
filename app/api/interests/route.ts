import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getUserInterests, setUserInterests } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const interests = await getUserInterests(userId);
  return NextResponse.json(interests);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { categories } = await req.json();
  if (!Array.isArray(categories) || categories.length < 1)
    return NextResponse.json({ error: "Provide at least 1 category" }, { status: 400 });
  await setUserInterests(userId, categories);
  return NextResponse.json({ ok: true });
}
