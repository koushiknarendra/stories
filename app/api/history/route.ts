export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { getReadHistory } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getReadHistory(userId));
}
