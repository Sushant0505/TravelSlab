import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  CalendarClock,
  Clock,
  Check,
  Star,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { DESTINATIONS, getDestination } from "@/lib/destinations";
import { tripsForDestination } from "@/lib/trips";
import { formatINR } from "@/lib/utils";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PlanTripButton } from "@/components/destination/plan-trip-button";

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return { title: "Destination not found" };
  return {
    title: `${d.name} Trips — Plan Your ${d.name} Trip`,
    description: d.brief,
    openGraph: { title: `${d.name} · TripSlab`, description: d.brief, images: [d.image] },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) notFound();

  const related = tripsForDestination(slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.brief,
    image: d.image,
    touristType: d.knownFor,
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[68svh] items-end overflow-hidden">
          <Image
            src={d.image}
            alt={d.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/30" />
          <div className="container relative z-10 pb-12 pt-28 text-white">
            <Link
              href="/#destinations"
              className="text-sm text-white/70 hover:text-white"
            >
              ← All destinations
            </Link>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <MapPin className="h-4 w-4" />
              {d.region}
            </div>
            <h1 className="mt-1 font-display text-4xl font-bold sm:text-6xl">
              {d.name}
            </h1>
            <p className="mt-2 max-w-xl text-lg text-white/85">{d.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {d.knownFor.map((k) => (
                <span
                  key={k}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="py-14">
          <div className="container grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold">
                About {d.name}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                {d.brief}
              </p>

              <h3 className="mt-8 font-display text-xl font-bold">
                Trip highlights
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {d.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sticky plan card */}
            <aside className="lg:pl-4">
              <div className="sticky top-24 rounded-3xl border border-border/60 bg-card p-6 shadow-xl">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Starting from
                </div>
                <div className="mt-1 font-display text-3xl font-bold">
                  {formatINR(d.startingFrom)}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    /person
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Best time:</span>
                    <span className="font-medium">{d.bestTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Ideal length:</span>
                    <span className="font-medium">{d.idealDays}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <PlanTripButton
                    destination={d.name}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[position:right_center]"
                  />
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Free for travelers · agencies compete for your trip
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Related trips */}
        {related.length > 0 && (
          <section className="border-t border-border/60 bg-muted/30 py-14">
            <div className="container">
              <h2 className="mb-6 font-display text-2xl font-bold">
                {d.name} group departures
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((t) => (
                  <div
                    key={t.slug}
                    className="overflow-hidden rounded-3xl border border-border/60 bg-card"
                  >
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={t.image}
                        alt={t.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{t.title}</h3>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-bold">{formatINR(t.price)}</span>
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {t.rating} ({t.reviews})
                        </span>
                      </div>
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
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Ready for {d.name}?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Tell us your dates and budget — verified agencies will send you
              tailored {d.name} itineraries.
            </p>
            <div className="mt-6 flex justify-center">
              <PlanTripButton destination={d.name} />
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
