import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminListAgencies,
  adminAgencyAction,
  type AgencyAction,
} from "@/server/admin-repo";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, agencies: await adminListAgencies() });
}

const schema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "suspend", "block", "reset_password"]),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const res = await adminAgencyAction(
    parsed.data.id,
    parsed.data.action as AgencyAction,
    { note: parsed.data.note },
  );
  if (!res.ok) return NextResponse.json(res, { status: 404 });
  return NextResponse.json({ ok: true });
}
