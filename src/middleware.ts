import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

/**
 * Route protection.
 *
 * Pages:
 *   /admin/**     -> ADMIN session (except /admin/login)
 *   /agencies/**  -> AGENCY session (except /agencies/login, /agencies/register)
 * Unauthenticated page requests redirect to the login page (?next=...).
 *
 * APIs (return JSON 401 instead of redirecting):
 *   /api/admin/**    -> ADMIN
 *   /api/agency/**   -> AGENCY (except /api/agency/register, which is public)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  // ---- API guards ----
  if (pathname.startsWith("/api/admin")) {
    return session?.role === "ADMIN" ? NextResponse.next() : json401();
  }
  if (pathname.startsWith("/api/agency")) {
    if (pathname === "/api/agency/register") return NextResponse.next();
    return session?.role === "AGENCY" ? NextResponse.next() : json401();
  }

  // ---- Admin pages ----
  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    if (session?.role === "ADMIN")
      return isLogin
        ? NextResponse.redirect(new URL("/admin", req.url))
        : NextResponse.next();
    return isLogin ? NextResponse.next() : redirectToLogin(req, "/admin/login", pathname);
  }

  // ---- Agency pages ----
  if (pathname.startsWith("/agencies")) {
    const isPublic =
      pathname === "/agencies/login" || pathname === "/agencies/register";
    if (session?.role === "AGENCY")
      return pathname === "/agencies/login"
        ? NextResponse.redirect(new URL("/agencies", req.url))
        : NextResponse.next();
    return isPublic
      ? NextResponse.next()
      : redirectToLogin(req, "/agencies/login", pathname);
  }

  return NextResponse.next();
}

function json401() {
  return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}

function redirectToLogin(req: NextRequest, loginPath: string, next: string) {
  const url = new URL(loginPath, req.url);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/agencies/:path*",
    "/api/admin/:path*",
    "/api/agency/:path*",
  ],
};
