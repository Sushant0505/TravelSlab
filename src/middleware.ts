import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE, type Role } from "@/lib/auth";

/**
 * Role-based access control (RBAC).
 *
 * Every portal is locked to exactly one role, read from the JWT session cookie
 * (`verifySession` decodes + verifies the token — no DB call, edge-safe):
 *
 *   Pages                         APIs                    Role
 *   /admin/**                     /api/admin/**           ADMIN
 *   /agencies/**                  /api/agency/**          AGENCY
 *   /dashboard/**                 /api/traveler/**        TRAVELER
 *
 * Access rules:
 *   - The matching role is allowed through.
 *   - A signed-in user hitting a portal that isn't theirs (wrong role), and any
 *     traveler hitting /admin or /agencies, is UNAUTHORIZED -> redirected to
 *     /login (APIs answer 401 JSON).
 *   - A guest (no session) is sent to that portal's own login page so the
 *     existing admin/agency/traveler login flows keep working.
 *   - Login/registration pages inside a portal stay public; a member who is
 *     already signed in is bounced to their dashboard.
 */

interface PageArea {
  prefix: string;
  role: Role;
  /** Where a guest is sent to authenticate for this portal. */
  login: string;
  /** Where an authenticated member of this role lands. */
  home: string;
  /** Paths inside the portal that never require a session (login/register). */
  publicPaths: string[];
}

const PAGE_AREAS: PageArea[] = [
  {
    prefix: "/admin",
    role: "ADMIN",
    login: "/admin/login",
    home: "/admin",
    publicPaths: ["/admin/login"],
  },
  {
    prefix: "/agencies",
    role: "AGENCY",
    login: "/agencies/login",
    home: "/agencies",
    publicPaths: [
      "/agencies/login",
      "/agencies/register",
      "/agencies/forgot-password",
      "/agencies/reset-password",
    ],
  },
  {
    prefix: "/dashboard",
    role: "TRAVELER",
    login: "/login",
    home: "/dashboard",
    publicPaths: [],
  },
];

const API_AREAS: { prefix: string; role: Role; publicPaths: string[] }[] = [
  { prefix: "/api/admin", role: "ADMIN", publicPaths: [] },
  { prefix: "/api/agency", role: "AGENCY", publicPaths: ["/api/agency/register"] },
  { prefix: "/api/traveler", role: "TRAVELER", publicPaths: [] },
];

/** True when `pathname` is the prefix itself or a nested route under it. */
function inArea(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const role = session?.role;

  // ---- API RBAC (respond with 401 JSON, never a redirect) ----
  for (const area of API_AREAS) {
    if (!inArea(pathname, area.prefix)) continue;
    if (area.publicPaths.includes(pathname)) return NextResponse.next();
    return role === area.role ? NextResponse.next() : json401();
  }

  // ---- Page RBAC ----
  for (const area of PAGE_AREAS) {
    if (!inArea(pathname, area.prefix)) continue;

    // Public pages in the portal (login/register): let anyone view them, but
    // send a member who is already signed in straight to their dashboard.
    if (area.publicPaths.includes(pathname)) {
      return role === area.role
        ? NextResponse.redirect(new URL(area.home, req.url))
        : NextResponse.next();
    }

    // Protected page — must hold exactly this portal's role.
    if (role === area.role) return NextResponse.next();

    // Guest -> this portal's login. Wrong role (incl. travelers) -> /login.
    const target = session ? "/login" : area.login;
    return redirectToLogin(req, target, pathname);
  }

  // ---- Traveler auth pages: keep signed-in travelers out of login/signup ----
  if (pathname === "/login" || pathname === "/signup") {
    return role === "TRAVELER"
      ? NextResponse.redirect(new URL("/dashboard", req.url))
      : NextResponse.next();
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
    // Bare portal roots + all nested routes (explicit roots avoid any
    // ambiguity in how ":path*" matches the prefix itself).
    "/admin",
    "/admin/:path*",
    "/agencies",
    "/agencies/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/api/admin/:path*",
    "/api/agency/:path*",
    "/api/traveler/:path*",
  ],
};
