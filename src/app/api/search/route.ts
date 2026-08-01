import { NextRequest, NextResponse } from "next/server";
import { listPublicDestinations } from "@/server/destination-repo";
import { listPublicPackages } from "@/server/package-repo";
import { MENU_CATEGORIES, TRIPS } from "@/lib/trips";
import { TRIP_TYPES } from "@/lib/destinations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SearchResults {
  destinations: { slug: string; name: string; region: string; image: string }[];
  packages: {
    slug: string;
    name: string;
    destinationName: string;
    price: number;
    image: string;
  }[];
  themes: { label: string; href: string }[];
}

/** Global search across destinations, approved packages and travel themes. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ destinations: [], packages: [], themes: [] } satisfies SearchResults);
  }

  const [dests, pkgs] = await Promise.all([
    listPublicDestinations(),
    listPublicPackages({ limit: 60 }),
  ]);

  const destinations = dests
    .filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)),
    )
    .slice(0, 8)
    .map((d) => ({ slug: d.slug, name: d.name, region: d.region, image: d.heroImage }));

  const packages = pkgs
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.destinationName.toLowerCase().includes(q) ||
        p.highlights.some((h) => h.toLowerCase().includes(q)),
    )
    .slice(0, 8)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      destinationName: p.destinationName,
      price: p.price,
      image: p.heroImage,
    }));

  const themePool = [
    ...MENU_CATEGORIES.map((c) => ({ label: c.label, href: "/plan" })),
    ...TRIP_TYPES.map((t) => ({ label: `${t} trips`, href: "/plan" })),
  ];
  const themes = themePool.filter((t) => t.label.toLowerCase().includes(q)).slice(0, 6);

  return NextResponse.json({ destinations, packages, themes } satisfies SearchResults);
}
