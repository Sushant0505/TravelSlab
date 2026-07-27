import { NextRequest, NextResponse } from "next/server";
import { listMarketplace, destinationsInMarket } from "@/server/lead-repo";
import { getSession } from "@/lib/auth";
import type { SlabId } from "@/lib/slabs";

export const runtime = "nodejs";

/**
 * GET /api/agency/leads — masked marketplace listing.
 *
 * IMPORTANT: this endpoint returns ONLY the safe MarketplaceLead shape
 * (no name / phone / email / exact date). PII is served exclusively by the
 * purchase endpoint after payment.
 *
 * In production, gate this behind an authenticated APPROVED agency session.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slab = (sp.get("slab") as SlabId | null) ?? undefined;
  const destination = sp.get("destination") ?? undefined;
  const minScore = sp.get("minScore") ? Number(sp.get("minScore")) : undefined;
  const hideSold = sp.get("hideSold") === "1";
  const sort =
    (sp.get("sort") as
      | "newest"
      | "score"
      | "priceLow"
      | "priceHigh"
      | null) ?? "newest";

  // Marketplace is non-exclusive; "owned" and hideSold are per-agency.
  const session = await getSession();
  const agencyId = session?.role === "AGENCY" ? session.id : undefined;

  const [leads, destinations] = await Promise.all([
    listMarketplace({ slab, destination, minScore, hideSold, sort }, agencyId),
    destinationsInMarket(),
  ]);

  return NextResponse.json({
    ok: true,
    count: leads.length,
    destinations,
    leads,
  });
}
