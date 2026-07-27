import { NextResponse } from "next/server";
import { adminOverview } from "@/server/admin-repo";

export const runtime = "nodejs";

// GET /api/admin/overview — KPI summary. Gate behind an admin session in prod.
export async function GET() {
  return NextResponse.json({ ok: true, overview: await adminOverview() });
}
