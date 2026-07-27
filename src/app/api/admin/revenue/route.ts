import { NextResponse } from "next/server";
import { adminRevenue } from "@/server/admin-repo";

export const runtime = "nodejs";

// GET /api/admin/revenue — daily/monthly revenue + top agencies for charts.
export async function GET() {
  return NextResponse.json({ ok: true, ...(await adminRevenue(30)) });
}
