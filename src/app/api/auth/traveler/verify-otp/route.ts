import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { findTravelerByIdentifier } from "@/server/traveler-repo";
import { verifyOtp } from "@/lib/otp";

export const runtime = "nodejs";

const schema = z.object({
  identifier: z.string().trim().min(3),
  otp: z.string().length(6),
});

/**
 * POST /api/auth/traveler/verify-otp — passwordless login step 2.
 * Verifies the OTP and starts a traveler session.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const account = await findTravelerByIdentifier(parsed.data.identifier);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const result = await verifyOtp(account.mobile, parsed.data.otp);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const token = await signSession({
    role: "TRAVELER",
    id: account.id,
    name: account.name,
    email: account.email,
  });
  const res = NextResponse.json({ ok: true, user: account });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
