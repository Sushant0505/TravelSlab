import { NextRequest, NextResponse } from "next/server";
import { listPublicPackages, type PublicPackageFilter } from "@/server/package-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Public: APPROVED packages with optional filters. Agency identity is stripped
 * by the repo's public projection — this route can never leak it.
 *
 *   /api/packages?destination=goa&minPrice=5000&maxPrice=10000&month=Nov&minDays=5
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filter: PublicPackageFilter = {
    destinationSlug: sp.get("destination") || undefined,
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")) ?? null,
    minDays: num(sp.get("minDays")),
    maxDays: num(sp.get("maxDays")),
    month: sp.get("month") || undefined,
    typeId: sp.get("type") || undefined,
    featured: sp.get("featured") === "1" ? true : undefined,
    limit: num(sp.get("limit")),
  };
  // A missing maxPrice must mean "no upper bound", not "< null" — normalise.
  if (sp.get("maxPrice") == null) delete filter.maxPrice;

  const packages = await listPublicPackages(filter);
  return NextResponse.json({ packages });
}
