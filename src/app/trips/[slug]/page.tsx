import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Clock,
  Users,
  Check,
  X as XIcon,
  CalendarDays,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { getPublicPackageBySlug, packagesForDestination } from "@/server/package-repo";
import { getPublicDestinationBySlug } from "@/server/destination-repo";
import { formatINR } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PlanTripButton } from "@/components/destination/plan-trip-button";
import { Gallery } from "@/components/destination/gallery";
import { FaqAccordion } from "@/components/destination/faq-accordion";
import { PackageCard } from "@/components/packages/package-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicPackageBySlug(slug);
  if (!p) return { title: "Trip not found" };
  const title = `${p.name} — ${p.duration} | TripSlab`;
  const description =
    p.description.length > 20
      ? p.description.slice(0, 300)
      : `${p.name} in ${p.destinationName}. ${p.duration}, from ${formatINR(p.price)} per person.`;
  return {
    title,
    description,
    alternates: { canonical: `/trips/${p.slug}` },
    openGraph: { title, description, images: [p.heroImage], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [p.heroImage] },
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = await getPublicPackageBySlug(slug);
  if (!pkg) notFound();

  const [destination, siblings] = await Promise.all([
    getPublicDestinationBySlug(pkg.destinationSlug),
    packagesForDestination(pkg.destinationSlug),
  ]);
  const related = siblings.filter((p) => p.id !== pkg.id).slice(0, 3);
  const gallery = pkg.images.length ? pkg.images : [pkg.heroImage];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pkg.name,
    description: pkg.description,
    image: gallery,
    category: `${pkg.destinationName} trip package`,
    offers: {
      "@type": "Offer",
      price: pkg.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[56svh] items-end overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pkg.heroImage} alt={pkg.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />
          <div className="container relative z-10 pb-12 pt-28 text-white">
            <Link
              href={`/destinations/${pkg.destinationSlug}`}
              className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
            >
              <MapPin className="h-4 w-4" /> {pkg.destinationName}
            </Link>
            <h1 className="mt-2 max-w-3xl font-display text-3xl font-bold sm:text-5xl">{pkg.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {pkg.duration}</span>
              {pkg.maxTravelers > 0 && (
                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> Up to {pkg.maxTravelers}</span>
              )}
              {pkg.slabLabel && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">{pkg.slabLabel}</span>
              )}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container grid gap-10 lg:grid-cols-3">
            {/* Main */}
            <div className="space-y-10 lg:col-span-2">
              <div>
                <h2 className="font-display text-2xl font-bold">Overview</h2>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{pkg.description}</p>
              </div>

              {pkg.images.length > 1 && (
                <div>
                  <h3 className="mb-4 font-display text-xl font-bold">Gallery</h3>
                  <Gallery images={pkg.images} title={pkg.name} />
                </div>
              )}

              {pkg.highlights.length > 0 && (
                <div>
                  <h3 className="mb-4 font-display text-xl font-bold">Highlights</h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {pkg.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pkg.itinerary.length > 0 && (
                <div>
                  <h3 className="mb-4 font-display text-xl font-bold">Day-by-day itinerary</h3>
                  <ol className="relative space-y-4 border-l-2 border-border/60 pl-6">
                    {pkg.itinerary.map((day, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
                          {day.day}
                        </span>
                        <h4 className="font-semibold">{day.title}</h4>
                        {day.detail && <p className="mt-1 text-sm text-muted-foreground">{day.detail}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {(pkg.inclusions.length > 0 || pkg.exclusions.length > 0) && (
                <div className="grid gap-6 sm:grid-cols-2">
                  {pkg.inclusions.length > 0 && (
                    <div className="rounded-2xl border border-border/60 bg-card p-5">
                      <h3 className="mb-3 font-display text-lg font-bold">What's included</h3>
                      <ul className="space-y-2">
                        {pkg.inclusions.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.exclusions.length > 0 && (
                    <div className="rounded-2xl border border-border/60 bg-card p-5">
                      <h3 className="mb-3 font-display text-lg font-bold">Not included</h3>
                      <ul className="space-y-2">
                        {pkg.exclusions.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {destination && destination.faqs.length > 0 && (
                <div>
                  <h3 className="mb-4 font-display text-xl font-bold">Good to know</h3>
                  <FaqAccordion faqs={destination.faqs} />
                </div>
              )}
            </div>

            {/* Sticky booking card */}
            <aside>
              <div className="sticky top-24 rounded-3xl border border-border/60 bg-card p-6 shadow-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Price per person
                </div>
                <div className="mt-1 font-display text-3xl font-bold">{formatINR(pkg.price)}</div>

                {pkg.dates.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> Departure dates
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {pkg.dates.slice(0, 8).map((d, i) => (
                        <span key={i} className="rounded-lg bg-muted px-2 py-1 text-xs">
                          {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <PlanTripButton
                    destination={pkg.destinationName}
                    perHeadBudget={pkg.price}
                    label="Plan this trip"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[position:right_center]"
                  />
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Free for travellers · verified agencies quote for your trip
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Related packages */}
        {related.length > 0 && (
          <section className="border-t border-border/60 bg-muted/20 py-14">
            <div className="container">
              <div className="mb-6 flex items-end justify-between">
                <h2 className="font-display text-2xl font-bold">More {pkg.destinationName} trips</h2>
                <Link
                  href={`/destinations/${pkg.destinationSlug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p, i) => (
                  <PackageCard key={p.id} pkg={p} index={i} />
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
