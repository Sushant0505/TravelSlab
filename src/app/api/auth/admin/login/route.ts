import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import {
  ADMIN_ID,
  ADMIN_NAME,
  ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  // Demo: single admin. Production: verify against Admin table password hash.
  const ok =
    parsed.data.email.trim().toLowerCase() === ADMIN_EMAIL &&
    parsed.data.password === DEMO_ADMIN_PASSWORD;
  if (!ok)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = await signSession({
    role: "ADMIN",
    id: ADMIN_ID,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
