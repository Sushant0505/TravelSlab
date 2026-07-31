import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { findAgencyAuthByEmail } from "@/server/agency-auth-repo";
import { verifyPassword } from "@/lib/agency-auth";
import { checkAuthRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const STATUS_MESSAGE: Record<string, string> = {
  PENDING: "Your agency account is awaiting approval.",
  SUSPENDED: "Your agency account has been suspended. Please contact support.",
  BLOCKED: "Your agency account has been blocked.",
};

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const email = parsed.data.email.trim().toLowerCase();

  // Throttle brute-force attempts per email.
  const rl = await checkAuthRateLimit(`agency-login:${email}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const agency = await findAgencyAuthByEmail(email);

  // Same generic error whether the email is unknown or the password is wrong.
  const passwordOk =
    agency !== null && (await verifyPassword(parsed.data.password, agency.passwordHash));
  if (!agency || !passwordOk) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Only APPROVED agencies may sign in.
  if (agency.status !== "APPROVED") {
    return NextResponse.json(
      { error: STATUS_MESSAGE[agency.status] ?? "Your account cannot sign in yet." },
      { status: 403 },
    );
  }

  const token = await signSession({
    role: "AGENCY",
    id: agency.id,
    name: agency.name,
    email: agency.email,
  });

  const res = NextResponse.json({
    ok: true,
    agency: { id: agency.id, name: agency.name },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
