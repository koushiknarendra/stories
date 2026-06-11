import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getDailyCard } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await getDailyCard(userId);
  if (!card) return NextResponse.json(null);
  return NextResponse.json(card);
}
