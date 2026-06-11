import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  const deviceId = request.cookies.get("device_id")?.value;
  if (!deviceId) {
    return NextResponse.json({ ok: false, error: "No device ID" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    // DB not configured — silently OK so the UI never breaks
    return NextResponse.json({ ok: true });
  }

  const body = await request.json() as {
    storyId: string;
    storyTitle?: string;
    storySource?: string;
    action: "like" | "dislike";
  };

  const { storyId, storyTitle, storySource, action } = body;

  await sql`
    INSERT INTO devices (id) VALUES (${deviceId})
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    INSERT INTO interactions (device_id, story_id, story_title, story_source, action)
    VALUES (${deviceId}, ${storyId}, ${storyTitle ?? null}, ${storySource ?? null}, ${action})
    ON CONFLICT (device_id, story_id)
    DO UPDATE SET action = ${action}, created_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
