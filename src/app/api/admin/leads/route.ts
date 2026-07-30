import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminListLeads,
  adminLeadAction,
  leadStats,
  type LeadAction,
} from "@/server/lead-repo";
import type { LeadStatus } from "@/lib/masking";

export const runtime = "nodejs";

// GET /api/admin/leads?status=SOLD
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") as LeadStatus | null;
  const [stats, leads] = await Promise.all([
    leadStats(),
    adminListLeads(status ?? undefined),
  ]);
  return NextResponse.json({ ok: true, stats, leads });
}

const actionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["hide", "unhide", "mark_fraud", "delete", "assign"]),
  status: z
    .enum(["NEW", "VERIFIED", "AVAILABLE", "SOLD", "HIDDEN", "FRAUD"])
    .optional(),
  note: z.string().max(500).optional(),
});

// POST /api/admin/leads — edit/hide/mark-fraud/assign/delete a lead
export async function POST(req: NextRequest) {
  const parsed = actionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const { id, action, status, note } = parsed.data;
  const res = await adminLeadAction(id, action as LeadAction, { status, note });
  if (!res.ok) return NextResponse.json(res, { status: 404 });
  return NextResponse.json({ ok: true });
}
