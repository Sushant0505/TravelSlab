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

  // Credentials come from env in production; the demo password only works in
  // local dev, so a launched site can't be opened with the built-in password.
  const isProd = process.env.NODE_ENV === "production";
  const adminEmail = (process.env.ADMIN_EMAIL ?? ADMIN_EMAIL).trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? (isProd ? "" : DEMO_ADMIN_PASSWORD);
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Admin login isn’t configured. Set ADMIN_PASSWORD in the environment." },
      { status: 503 },
    );
  }

  const ok =
    parsed.data.email.trim().toLowerCase() === adminEmail &&
    parsed.data.password === adminPassword;
  if (!ok)
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const token = await signSession({
    role: "ADMIN",
    id: ADMIN_ID,
    name: ADMIN_NAME,
    email: adminEmail,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
