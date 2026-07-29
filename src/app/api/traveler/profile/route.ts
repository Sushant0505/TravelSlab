import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getTravelerAccount, updateTravelerProfile } from "@/server/traveler-repo";

export const runtime = "nodejs";

/** GET /api/traveler/profile — the traveler's account details. */
export async function GET() {
  const session = await getSession();
  if (session?.role !== "TRAVELER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = await getTravelerAccount(session.id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, account });
}

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

/** PATCH /api/traveler/profile — update name / mobile. */
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "TRAVELER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const account = await updateTravelerProfile(session.id, parsed.data);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, account });
}
