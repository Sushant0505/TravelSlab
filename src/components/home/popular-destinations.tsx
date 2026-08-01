"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin, Flame } from "lucide-react";
import { DESTINATIONS } from "@/lib/destinations";
import { SLABS } from "@/lib/slabs";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BudgetFilter, type TierView } from "./budget-filter";

/** Normalised card shape (works for the static catalogue + DB destinations). */
interface DestCard {
  slug: string;
  name: string;
  region: string;
  image: string;
  tagline: string;
  trending: boolean;
  startingFrom: number;
}

interface ApiDestination {
  slug: string;
  name: string;
  region: string;
  heroImage: string;
  tags: string[];
  featured: boolean;
  startingFrom: number;
}

function defaultTierViews(): TierView[] {
  return SLABS.map((s) => ({
    id: s.id,
    label: s.label,
    minPerHead: s.min,
    maxPerHead: Number.isFinite(s.max) ? s.max : null,
    leadPrice: s.leadPrice,
  }));
}

/** Built-in catalogue → cards, shown instantly then replaced by DB data. */
function catalogueCards(): DestCard[] {
  return DESTINATIONS.map((d) => ({
    slug: d.slug,
    name: d.name,
    region: d.region,
    image: d.image,
    tagline: d.tagline,
    trending: Boolean(d.trending),
    startingFrom: d.startingFrom,
  }));
}

function apiToCard(d: ApiDestination): DestCard {
  return {
    slug: d.slug,
    name: d.name,
    region: d.region,
    image: d.heroImage,
    tagline: d.tags.slice(0, 3).join(" · "),
    trending: d.featured,
    startingFrom: d.startingFrom,
  };
}

export function PopularDestinations() {
  const { data: tierData } = useQuery({
    queryKey: ["slab-tiers-public"],
    queryFn: async (): Promise<{ tiers: TierView[] }> => (await fetch("/api/slab-tiers")).json(),
    placeholderData: { tiers: defaultTierViews() },
    staleTime: 60_000,
  });
  const tiers = tierData?.tiers?.length ? tierData.tiers : defaultTierViews();

  const { data: destData } = useQuery({
    queryKey: ["destinations-public"],
    queryFn: async (): Promise<{ destinations: ApiDestination[] }> =>
      (await fetch("/api/destinations")).json(),
    // paint the built-in catalogue instantly, then swap to the admin's live list
    placeholderData: {
      destinations: DESTINATIONS.map((d) => ({
        slug: d.slug,
        name: d.name,
        region: d.region,
        heroImage: d.image,
        tags: d.knownFor,
        featured: Boolean(d.trending),
        startingFrom: d.startingFrom,
      })),
    },
    staleTime: 30_000,
  });

  const destinations: DestCard[] = destData?.destinations?.length
    ? destData.destinations.map(apiToCard)
    : catalogueCards();

  const buckets = useMemo(() => {
    const map: Record<string, DestCard[]> = {};
    for (const t of tiers) {
      map[t.id] = destinations.filter(
        (d) => d.startingFrom >= t.minPerHead && (t.maxPerHead == null || d.startingFrom < t.maxPerHead),
      );
    }
    return map;
  }, [tiers, destinations]);

  const [slab, setSlab] = useState<string | null>(null);
  const visible = slab ? buckets[slab] ?? [] : destinations;
  const selectedLabel = tiers.find((t) => t.id === slab)?.label ?? "";

  return (
    <section id="destinations" className="py-16 md:py-20">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Popular right now
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Where India is heading
          </h2>
          <p className="mt-3 text-muted-foreground">
            Filter by budget slab, then tap any destination to start a plan.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <BudgetFilter
            tiers={tiers}
            buckets={buckets}
            total={destinations.length}
            selected={slab}
            onSelect={setSlab}
          />

          <div>
            {slab && (
              <p className="mb-4 text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{visible.length}</span>{" "}
                {visible.length === 1 ? "destination" : "destinations"} under{" "}
                <span className="font-semibold text-foreground">{selectedLabel}</span> per traveler.
              </p>
            )}

            {visible.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center">
                <p className="font-display text-lg font-semibold">No destinations in this slab yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a higher budget band — or plan a custom trip and let agencies quote for it.
                </p>
                <Button variant="gradient" size="sm" className="mt-4" onClick={() => setSlab(null)}>
                  Show all budgets
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {visible.map((d, i) => (
                  <TiltCard key={d.slug} d={d} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TiltCard({ d, index }: { d: DestCard; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.a
      ref={ref}
      href={`/destinations/${d.slug}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 4) * 0.06, duration: 0.5 }}
      className="group relative block aspect-[3/4] overflow-hidden rounded-3xl [transform-style:preserve-3d]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={d.image}
        alt={d.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 bg-primary/0 transition-colors duration-500 group-hover:bg-primary/10" />

      {d.trending && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <Flame className="h-3 w-3" /> Trending
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 text-white" style={{ transform: "translateZ(40px)" }}>
        <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-white/70">
          <MapPin className="h-3 w-3" />
          {d.region}
        </div>
        <h3 className="mt-0.5 font-display text-xl font-bold">{d.name}</h3>
        {d.tagline && <p className="text-xs text-white/75">{d.tagline}</p>}
        <div className="mt-2 translate-y-2 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          From {formatINR(d.startingFrom)}
          <span className="text-white/60"> /person</span>
        </div>
      </div>
    </motion.a>
  );
}
