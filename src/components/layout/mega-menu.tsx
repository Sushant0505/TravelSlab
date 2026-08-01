"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Compass, Flame, ArrowRight } from "lucide-react";
import { DESTINATIONS } from "@/lib/destinations";
import { formatINR, cn } from "@/lib/utils";
import { TripTypeIcon } from "@/components/shared/trip-type-icon";
import type { PublicPackage } from "@/server/package-repo";

/* ------------------------------------------------------------------ */
/* Shared data hooks (dynamic, with instant static placeholder)       */
/* ------------------------------------------------------------------ */

interface MenuDest {
  slug: string;
  name: string;
  scope: "India" | "World";
  image: string;
  tagline: string;
  featured: boolean;
}
interface MenuType {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  icon: string;
}

function useMenuDestinations() {
  const placeholder: MenuDest[] = DESTINATIONS.map((d) => ({
    slug: d.slug,
    name: d.name,
    scope: d.scope,
    image: d.image,
    tagline: d.tagline,
    featured: Boolean(d.trending),
  }));
  const { data } = useQuery({
    queryKey: ["destinations-public"],
    queryFn: async (): Promise<{ destinations: (MenuDest & { heroImage: string; tags: string[] })[] }> =>
      (await fetch("/api/destinations")).json(),
    staleTime: 60_000,
  });
  const rows = data?.destinations;
  if (!rows?.length) return placeholder;
  return rows.map((d) => ({
    slug: d.slug,
    name: d.name,
    scope: d.scope,
    image: d.heroImage,
    tagline: d.tags?.slice(0, 3).join(" · ") ?? "",
    featured: d.featured,
  }));
}

const STATIC_TYPES: MenuType[] = [
  { id: "backpacking", name: "Backpacking Trips", slug: "backpacking", subtitle: "Budget group adventures", icon: "Backpack" },
  { id: "bike", name: "Bike Trips", slug: "bike-trips", subtitle: "Ladakh, Spiti, Zanskar", icon: "Bike" },
  { id: "treks", name: "Himalayan Treks", slug: "himalayan-treks", subtitle: "Himachal & Kashmir", icon: "Mountain" },
  { id: "beach", name: "Beach & Islands", slug: "beach-islands", subtitle: "Goa, Andaman, Bali", icon: "Waves" },
];

function useMenuTypes(): MenuType[] {
  const { data } = useQuery({
    queryKey: ["trip-types-public"],
    queryFn: async (): Promise<{ types: MenuType[] }> => (await fetch("/api/trip-types")).json(),
    staleTime: 60_000,
  });
  return data?.types?.length ? data.types : STATIC_TYPES;
}

function useMenuPackages() {
  const { data } = useQuery({
    queryKey: ["packages-home"],
    queryFn: async (): Promise<{ packages: PublicPackage[] }> =>
      (await fetch("/api/packages?limit=8")).json(),
    staleTime: 30_000,
  });
  return data?.packages ?? [];
}

/**
 * Generic hover dropdown. Renders a trigger and a full-width panel below the
 * (fixed, white) header. Pass the panel content via `panel`.
 */
export function NavMega({
  label,
  panel,
  highlight,
}: {
  label: string;
  panel: React.ReactNode;
  highlight?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const leave = () => {
    timer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="static" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        className={cn(
          "flex items-center gap-1 py-2 text-[15px] font-medium transition-colors",
          highlight ? "text-emerald-600" : "text-slate-700 hover:text-primary",
          open && !highlight && "text-primary",
        )}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-full z-40 px-4 pt-2"
          >
            <div className="container overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              {panel}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panels                                                             */
/* ------------------------------------------------------------------ */

export function DestinationsPanel() {
  const destinations = useMenuDestinations();
  const types = useMenuTypes();
  const india = destinations.filter((d) => d.scope === "India");
  const world = destinations.filter((d) => d.scope === "World");
  const trending = destinations.filter((d) => d.featured).slice(0, 6);

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-3 space-y-2 border-r border-slate-200 pr-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Category
        </p>
        {types.slice(0, 6).map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <TripTypeIcon name={c.icon} className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-800">{c.name}</span>
              <span className="block text-xs text-slate-400">{c.subtitle}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="col-span-6 border-r border-slate-200 pr-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Destinations · India
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {india.map((d) => (
            <Thumb key={d.slug} slug={d.slug} name={d.name} image={d.image} />
          ))}
        </div>
        {world.length > 0 && (
          <>
            <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
              World
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {world.map((d) => (
                <Thumb key={d.slug} slug={d.slug} name={d.name} image={d.image} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="col-span-3">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Flame className="h-3.5 w-3.5 text-secondary" /> Trending
        </p>
        <ul className="space-y-2.5">
          {trending.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/destinations/${d.slug}`}
                className="group block rounded-lg p-1.5 transition-colors hover:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-800 group-hover:text-primary">
                  {d.name}
                </span>
                <span className="block text-xs text-slate-400">{d.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
        <PromoCard />
      </div>
    </div>
  );
}

export function CustomizedPanel() {
  const types = useMenuTypes();
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-9">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Customize by trip type
        </p>
        <div className="grid grid-cols-4 gap-3">
          {types.map((t) => (
            <Link
              key={t.id}
              href={`/categories/${t.slug}`}
              className="group rounded-2xl border border-slate-200 p-3 transition-colors hover:border-primary/40 hover:bg-slate-50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <TripTypeIcon name={t.icon} className="h-4 w-4" />
              </span>
              <span className="mt-2 block text-sm font-semibold text-slate-800 group-hover:text-primary">
                {t.name}
              </span>
              <span className="block text-xs text-slate-400">{t.subtitle}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="col-span-3 border-l border-slate-200 pl-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Not sure?
        </p>
        <p className="text-sm text-slate-500">
          Tell us where and your budget — we&apos;ll match you with agencies who
          build a custom itinerary for free.
        </p>
        <PromoCard />
      </div>
    </div>
  );
}

export function TrendingPanel() {
  const destinations = useMenuDestinations();
  const packages = useMenuPackages();
  const trending = destinations.filter((d) => d.featured).slice(0, 12);
  const trips = packages.slice(0, 4);

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Trending trips right now
        </p>
        {trips.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {trips.map((t) => (
              <Link
                key={t.slug}
                href={`/trips/${t.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200"
              >
                <span className="relative block aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.heroImage}
                    alt={t.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="block p-2.5">
                  <span className="line-clamp-1 text-xs font-semibold text-slate-800">{t.name}</span>
                  <span className="mt-0.5 block text-xs font-bold text-primary">{formatINR(t.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {destinations.slice(0, 4).map((d) => (
              <Thumb key={d.slug} slug={d.slug} name={d.name} image={d.image} />
            ))}
          </div>
        )}
      </div>
      <div className="col-span-4 border-l border-slate-200 pl-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
          <Flame className="h-3.5 w-3.5 text-secondary" /> Trending destinations
        </p>
        <div className="flex flex-wrap gap-2">
          {trending.map((d) => (
            <Link
              key={d.slug}
              href={`/destinations/${d.slug}`}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-primary hover:text-white"
            >
              {d.name}
            </Link>
          ))}
        </div>
        <PromoCard />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bits                                                               */
/* ------------------------------------------------------------------ */

function Thumb({ slug, name, image }: { slug: string; name: string; image: string }) {
  return (
    <Link
      href={`/destinations/${slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-1.5 text-center text-[11px] font-semibold text-white">
        {name}
      </span>
    </Link>
  );
}

function PromoCard() {
  return (
    <Link
      href="/plan"
      className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-accent p-4 text-white"
    >
      <span>
        <span className="flex items-center gap-1.5 text-sm font-bold">
          <Compass className="h-4 w-4" /> Plan a custom trip
        </span>
        <span className="block text-xs text-white/80">Get matched with agencies</span>
      </span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
