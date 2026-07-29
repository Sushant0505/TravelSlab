import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { registerTraveler } from "@/server/traveler-repo";
import { notifyTraveler } from "@/server/notify-repo";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
  password: z.string().min(6, "Use at least 6 characters"),
});

/** POST /api/auth/traveler/register — create a traveler account + auto-login. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 422 },
    );
  }

  const result = await registerTraveler(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await notifyTraveler(result.account.id, {
    title: "Welcome to TripSlab 🎉",
    body: "Your account is ready. Plan a trip and verified agencies will reach out with tailored quotes.",
  });

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
