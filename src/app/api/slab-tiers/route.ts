import { NextResponse } from "next/server";
import { listSlabTiers } from "@/server/tier-repo";

export const runtime = "nodejs";

/**
 * GET /api/slab-tiers — public read of the admin-managed slab ranges + prices.
 * Used by the home budget filter and the agency lead-alerts panel so both
 * reflect the admin's configuration.
 */
export async function GET() {
  return NextResponse.json({ ok: true, tiers: await listSlabTiers() });
}
