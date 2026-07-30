import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { googleConfigured, googleRedirectUri, googleAuthUrl } from "@/lib/google";

export const runtime = "nodejs";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600, // 10 minutes to complete the flow
};

/**
 * GET /api/auth/google/start — kick off Google sign-in.
 * Stores a CSRF `state` + post-login `next` in short-lived cookies, then
 * redirects to Google's consent screen.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/login?e=google_unconfigured", origin));
  }

  const nextParam = req.nextUrl.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
  const state = randomUUID();
  const redirectUri = googleRedirectUri(origin);

  const res = NextResponse.redirect(googleAuthUrl(redirectUri, state));
  res.cookies.set("g_oauth_state", state, COOKIE_OPTS);
  res.cookies.set("g_oauth_next", next, COOKIE_OPTS);
  return res;
}
