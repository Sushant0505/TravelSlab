import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Check, Star, ArrowRight, Quote } from "lucide-react";
import { getPublicDestinationBySlug } from "@/server/destination-repo";
import { packagesForDestination } from "@/server/package-repo";
import { listSlabTiers } from "@/server/tier-repo";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PlanTripButton } from "@/components/destination/plan-trip-button";
import { DestinationPackages } from "@/components/destination/destination-packages";
import { Gallery } from "@/components/destination/gallery";
import { FaqAccordion } from "@/components/destination/faq-accordion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = await getPublicDestinationBySlug(slug);
  if (!d) return { title: "Destination not found" };
  const title = d.seoTitle || `${d.name} Trips — Plan Your ${d.name} Trip | TripSlab`;
  const description = d.seoDescription || d.description;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: {
      title,
      description,
      images: [d.heroImage],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [d.heroImage] },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [d, packages, tiers] = await Promise.all([
    getPublicDestinationBySlug(slug),
    packagesForDestination(slug),
    listSlabTiers(),
  ]);
  if (!d) notFound();

  const tierViews = tiers.map((t) => ({
    id: t.id,
    label: t.label,
    minPerHead: t.minPerHead,
    maxPerHead: t.maxPerHead,
  }));

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: d.name,
      description: d.description,
      image: d.heroImage,
      touristType: d.tags,
    },
    d.faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: d.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[62svh] items-end overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.heroImage} alt={d.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/30" />
          <div className="container relative z-10 pb-12 pt-28 text-white">
            <Link href="/#destinations" className="text-sm text-white/70 hover:text-white">
              ← All destinations
            </Link>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              {d.region}
            </div>
            <h1 className="mt-1 font-display text-4xl font-bold sm:text-6xl">{d.name}</h1>
            {d.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {d.tags.map((k) => (
                  <span key={k} className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Overview + highlights */}
        <section className="py-14">
          <div className="container grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold">About {d.name}</h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{d.description}</p>

              {d.highlights.length > 0 && (
                <>
                  <h3 className="mt-8 font-display text-xl font-bold">Trip highlights</h3>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {d.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4">
                        <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{h}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <aside className="space-y-3">
              <FactCard label="Best time to visit" value={d.bestTime} />
              <FactCard label="Ideal duration" value={d.idealDuration} />
              <FactCard label="Region" value={`${d.region} · ${d.scope}`} />
              {d.tags.length > 0 && <FactCard label="Known for" value={d.tags.join(" · ")} />}
            </aside>
          </div>

          {d.gallery.length > 1 && (
            <div className="container mt-10">
              <h3 className="mb-4 font-display text-xl font-bold">{d.name} in photos</h3>
              <Gallery images={d.gallery} title={d.name} />
            </div>
          )}
        </section>

        {/* Packages (left pricing card + slab filter + auto-injected packages) */}
        <DestinationPackages
          destinationName={d.name}
          baselineStartingFrom={d.startingFrom}
          bestTime={d.bestTime}
          idealDuration={d.idealDuration}
          packages={packages}
          tiers={tierViews}
        />

        {/* FAQs */}
        {d.faqs.length > 0 && (
          <section className="py-14">
            <div className="container max-w-3xl">
              <h2 className="mb-6 font-display text-2xl font-bold">Frequently asked questions</h2>
              <FaqAccordion faqs={d.faqs} />
            </div>
          </section>
        )}

        {/* Reviews */}
        {d.reviews.length > 0 && (
          <section className="border-t border-border/60 bg-muted/20 py-14">
            <div className="container">
              <h2 className="mb-6 font-display text-2xl font-bold">Traveller reviews</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {d.reviews.map((r) => (
                  <div key={r.id} className="rounded-3xl border border-border/60 bg-card p-6">
                    <Quote className="h-6 w-6 text-primary/40" />
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-medium">{r.author}</span>
                      <span className="flex items-center gap-1 text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-16">
          <div className="container text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Ready for {d.name}?</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Tell us your dates and budget — verified agencies will send you tailored {d.name} itineraries.
            </p>
            <div className="mt-6 flex justify-center">
              <PlanTripButton destination={d.name} perHeadBudget={d.startingFrom} />
            </div>
            <Link
              href="/#destinations"
              className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              Explore other destinations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
