import { NextResponse } from "next/server";
import { runMigration } from "@/lib/db";

export async function GET() {
  try {
    await runMigration();
    return NextResponse.json({ ok: true, message: "Schema ready" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
