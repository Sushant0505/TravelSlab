import { SignJWT, jwtVerify } from "jose";

/**
 * Minimal JWT session auth (HS256, httpOnly cookie).
 *
 * Two roles: AGENCY and ADMIN. The token payload carries the role + a stable
 * id (agency id / admin id) used by the API routes to scope data. Works in
 * both Node route handlers and the Edge middleware because `jose` is isomorphic.
 */

export const SESSION_COOKIE = "ts_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "AGENCY" | "ADMIN";

export interface Session {
  role: Role;
  id: string;
  name: string;
  email: string;
}

function secret(): Uint8Array {
  const s =
    process.env.AUTH_SECRET ??
    "dev-only-insecure-secret-change-me-in-production";
  return new TextEncoder().encode(s);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(
  token: string | undefined | null,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.role || !payload.id) return null;
    return {
      role: payload.role as Role,
      id: payload.id as string,
      name: (payload.name as string) ?? "",
      email: (payload.email as string) ?? "",
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

/** Server-side helper: read + verify the session from the request cookies. */
export async function getSession(): Promise<Session | null> {
  // Imported lazily so this module stays usable from the Edge middleware,
  // which reads cookies from the request instead of next/headers.
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
