import type { MetadataRoute } from "next";
import { listPublicDestinationSlugs } from "@/server/destination-repo";
import { listPublicPackageSlugs } from "@/server/package-repo";
import { listPublicTripTypeSlugs } from "@/server/trip-type-repo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes = ["", "/plan", "/about", "/agencies", "/agencies/register"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  // Destinations + approved packages come from the database so admin/agency
  // additions are indexed automatically.
  const [destSlugs, pkgSlugs, typeSlugs] = await Promise.all([
    listPublicDestinationSlugs(),
    listPublicPackageSlugs(),
    listPublicTripTypeSlugs(),
  ]);

  const destinationRoutes = destSlugs.map((slug) => ({
    url: `${base}/destinations/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const packageRoutes = pkgSlugs.map((slug) => ({
    url: `${base}/trips/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const categoryRoutes = typeSlugs.map((slug) => ({
    url: `${base}/categories/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...destinationRoutes, ...packageRoutes, ...categoryRoutes];
}
