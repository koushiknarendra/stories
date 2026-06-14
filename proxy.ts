import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const isProtected = createRouteMatcher(["/space(.*)", "/collections(.*)", "/inbox(.*)", "/foryou(.*)", "/explore(.*)", "/profile(.*)"]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (isProtected(request as NextRequest)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
