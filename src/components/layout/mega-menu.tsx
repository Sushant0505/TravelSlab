"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Backpack,
  Bike,
  Mountain,
  Users,
  Heart,
  User,
  Crown,
  Laptop,
  Compass,
  Flame,
  ArrowRight,
} from "lucide-react";
import { DESTINATIONS } from "@/lib/destinations";
import { MENU_CATEGORIES, TRIPS } from "@/lib/trips";
import { formatINR, cn } from "@/lib/utils";

const CAT_ICONS: Record<string, typeof Backpack> = {
  Backpack,
  Bike,
  Mountain,
  Venus: Users,
};

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
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
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
  const india = DESTINATIONS.filter((d) => d.scope === "India");
  const world = DESTINATIONS.filter((d) => d.scope === "World");
  const trending = DESTINATIONS.filter((d) => d.trending);

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-3 space-y-2 border-r border-slate-200 pr-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Category
        </p>
        {MENU_CATEGORIES.map((c) => {
          const Icon = CAT_ICONS[c.icon] ?? Backpack;
          return (
            <Link
              key={c.label}
              href="/#destinations"
              className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {c.label}
                </span>
                <span className="block text-xs text-slate-400">{c.sub}</span>
              </span>
            </Link>
          );
        })}
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
        <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
          World
        </p>
        <div className="grid grid-cols-4 gap-2.5">
          {world.map((d) => (
            <Thumb key={d.slug} slug={d.slug} name={d.name} image={d.image} />
          ))}
        </div>
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

const TRIP_TYPES_META = [
  { label: "Backpacking", icon: Backpack, sub: "Budget group adventures" },
  { label: "Family", icon: Users, sub: "Comfortable & kid-friendly" },
  { label: "Honeymoon", icon: Heart, sub: "Romantic escapes" },
  { label: "Group / Friends", icon: Users, sub: "Squad getaways" },
  { label: "Solo", icon: User, sub: "Meet fellow travelers" },
  { label: "Luxury", icon: Crown, sub: "Premium stays & service" },
  { label: "Adventure", icon: Mountain, sub: "Treks, biking & more" },
  { label: "Workation", icon: Laptop, sub: "Work with a view" },
];

export function CustomizedPanel() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-9">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Customize by trip type
        </p>
        <div className="grid grid-cols-4 gap-3">
          {TRIP_TYPES_META.map((t) => (
            <Link
              key={t.label}
              href="/plan"
              className="group rounded-2xl border border-slate-200 p-3 transition-colors hover:border-primary/40 hover:bg-slate-50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <t.icon className="h-4 w-4" />
              </span>
              <span className="mt-2 block text-sm font-semibold text-slate-800 group-hover:text-primary">
                {t.label}
              </span>
              <span className="block text-xs text-slate-400">{t.sub}</span>
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
  const trips = TRIPS.slice(0, 4);
  const trending = DESTINATIONS.filter((d) => d.trending);

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Trending trips right now
        </p>
        <div className="grid grid-cols-4 gap-3">
          {trips.map((t) => (
            <Link
              key={t.slug}
              href={t.destinationSlug ? `/destinations/${t.destinationSlug}` : "/plan"}
              className="group overflow-hidden rounded-2xl border border-slate-200"
            >
              <span className="relative block aspect-[4/3] overflow-hidden">
                <Image
                  src={t.image}
                  alt={t.title}
                  fill
                  sizes="160px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="block p-2.5">
                <span className="line-clamp-1 text-xs font-semibold text-slate-800">
                  {t.title}
                </span>
                <span className="mt-0.5 block text-xs font-bold text-primary">
                  {formatINR(t.price)}
                </span>
              </span>
            </Link>
          ))}
        </div>
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
      <Image
        src={image}
        alt={name}
        fill
        sizes="120px"
        className="object-cover transition-transform duration-500 group-hover:scale-110"
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
        <span className="block text-xs text-white/80">
          Get matched with agencies
        </span>
      </span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
