export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createInboxItem } from "@/lib/db";

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);

  const sharedUrl = searchParams.get("url") || searchParams.get("text") || "";

  if (!userId || !sharedUrl) {
    redirect("/?url=" + encodeURIComponent(sharedUrl));
  }

  await createInboxItem(userId, sharedUrl.trim(), "url").catch(() => {});

  redirect("/space");
}
