import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import {
  getPublicTripTypeBySlug,
  listPublicTripTypes,
} from "@/server/trip-type-repo";
import { listPublicPackages } from "@/server/package-repo";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PackageCard } from "@/components/packages/package-card";
import { PlanTripButton } from "@/components/destination/plan-trip-button";
import { TripTypeIcon } from "@/components/shared/trip-type-icon";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const type = await getPublicTripTypeBySlug(slug);
  if (!type) return { title: "Category not found" };
  const title = `${type.name} — Packages from Verified Agencies | TripSlab`;
  const description = type.subtitle
    ? `${type.name}: ${type.subtitle}. Compare ${type.name.toLowerCase()} packages from verified agencies on TripSlab.`
    : `Browse ${type.name.toLowerCase()} packages from verified agencies on TripSlab.`;
  return {
    title,
    description,
    alternates: { canonical: `/categories/${type.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const type = await getPublicTripTypeBySlug(slug);
  if (!type) notFound();

  const [packages, allTypes] = await Promise.all([
    listPublicPackages({ typeId: type.id }),
    listPublicTripTypes(),
  ]);
  const otherTypes = allTypes.filter((t) => t.id !== type.id);

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: type.name,
    numberOfItems: packages.length,
    itemListElement: packages.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `/trips/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        {/* Header */}
        <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-background pt-28 pb-10">
          <div className="container">
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary">Home</Link>
              <span>/</span>
              <span className="text-foreground">{type.name}</span>
            </nav>
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <TripTypeIcon name={type.icon} className="h-7 w-7" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-bold sm:text-5xl">{type.name}</h1>
                {type.subtitle && <p className="mt-1 text-lg text-muted-foreground">{type.subtitle}</p>}
                <p className="mt-2 text-sm text-muted-foreground">
                  {packages.length} package{packages.length === 1 ? "" : "s"} from verified agencies
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="py-12">
          <div className="container">
            {packages.length === 0 ? (
              <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border/70 p-10 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </span>
                <p className="mt-3 font-display text-lg font-semibold">
                  No {type.name.toLowerCase()} yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Agencies are still adding {type.name.toLowerCase()}. Plan a custom trip and verified
                  agencies will send you tailored itineraries — free for travellers.
                </p>
                <div className="mt-5 flex justify-center">
                  <PlanTripButton destination="" label="Plan a custom trip" />
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {packages.map((p, i) => (
                  <PackageCard key={p.id} pkg={p} index={i} showDestination />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Other categories */}
        {otherTypes.length > 0 && (
          <section className="border-t border-border/60 bg-muted/20 py-12">
            <div className="container">
              <h2 className="mb-5 font-display text-xl font-bold">Browse other trip types</h2>
              <div className="flex flex-wrap gap-2.5">
                {otherTypes.map((t) => (
                  <Link
                    key={t.id}
                    href={`/categories/${t.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    <TripTypeIcon name={t.icon} className="h-4 w-4 text-primary" />
                    {t.name}
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
