import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { findAgencyByEmail } from "@/server/admin-repo";
import { DEMO_AGENCY_PASSWORD } from "@/lib/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });

  const agency = await findAgencyByEmail(parsed.data.email);

  // Demo: single shared password. Production: verify per-agency password hash.
  if (!agency || parsed.data.password !== DEMO_AGENCY_PASSWORD) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  if (agency.status !== "APPROVED") {
    return NextResponse.json(
      { error: `Your account is ${agency.status.toLowerCase()}. Contact support.` },
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
