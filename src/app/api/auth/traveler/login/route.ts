import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { loginTraveler } from "@/server/traveler-repo";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** POST /api/auth/traveler/login — verify credentials + start a session. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const result = await loginTraveler(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const token = await signSession({
    role: "TRAVELER",
    id: result.account.id,
    name: result.account.name,
    email: result.account.email,
  });
  const res = NextResponse.json({ ok: true, user: result.account });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
