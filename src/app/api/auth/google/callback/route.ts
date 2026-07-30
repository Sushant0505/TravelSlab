import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { googleRedirectUri, exchangeCodeForProfile } from "@/lib/google";
import { findOrCreateTravelerByEmail } from "@/server/traveler-repo";

export const runtime = "nodejs";

/**
 * GET /api/auth/google/callback — Google redirects here after consent.
 * Verifies state (CSRF), exchanges the code, then finds/creates the traveler
 * and starts a session — mirroring the OTP verify flow.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const params = req.nextUrl.searchParams;

  const clearTemp = (res: NextResponse) => {
    res.cookies.set("g_oauth_state", "", { path: "/", maxAge: 0 });
    res.cookies.set("g_oauth_next", "", { path: "/", maxAge: 0 });
    return res;
  };
  const fail = () =>
    clearTemp(NextResponse.redirect(new URL("/login?e=google_failed", origin)));

  try {
    if (params.get("error")) return fail();

    const code = params.get("code");
    const state = params.get("state");
    const cookieState = req.cookies.get("g_oauth_state")?.value;
    const nextCookie = req.cookies.get("g_oauth_next")?.value;
    const next = nextCookie && nextCookie.startsWith("/") ? nextCookie : "/dashboard";

    // CSRF: the returned state must match what we stored.
    if (!code || !state || !cookieState || state !== cookieState) return fail();

    const profile = await exchangeCodeForProfile(code, googleRedirectUri(origin));
    if (!profile.emailVerified) return fail();

    const account = await findOrCreateTravelerByEmail({
      name: profile.name,
      email: profile.email,
    });

    const token = await signSession({
      role: "TRAVELER",
      id: account.id,
      name: account.name,
      email: account.email,
    });

    const res = clearTemp(NextResponse.redirect(new URL(next, origin)));
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch {
    return fail();
  }
}
