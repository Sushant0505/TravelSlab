"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Clock,
  CalendarDays,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { upcomingTrips, MONTH_PILLS, type Trip } from "@/lib/trips";
import { formatINR } from "@/lib/utils";

type Scope = "Domestic" | "International";

export function UpcomingTrips() {
  const [scope, setScope] = useState<Scope>("Domestic");
  const [month, setMonth] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const trips = upcomingTrips(scope, month);

  function scrollBy(dir: number) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * (rail.clientWidth * 0.9), behavior: "smooth" });
  }

  return (
    <section id="upcoming-trips" className="py-12 md:py-16">
      <div className="container">
        {/* Header row: title · scope toggle · arrows */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Upcoming Trips
          </h2>

          <div className="flex items-center gap-3">
            <ScopeToggle scope={scope} onChange={setScope} />
            <div className="hidden items-center gap-2 sm:flex">
              <RailButton dir={-1} onClick={() => scrollBy(-1)} label="Scroll left" />
              <RailButton dir={1} onClick={() => scrollBy(1)} label="Scroll right" />
            </div>
          </div>
        </div>

        {/* Month filter pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          <MonthPill active={month === null} onClick={() => setMonth(null)}>
            All Months
          </MonthPill>
          {MONTH_PILLS.map((m) => (
            <MonthPill key={m} active={month === m} onClick={() => setMonth(m)}>
              {m}
            </MonthPill>
          ))}
        </div>

        {/* Cards rail */}
        {trips.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-muted-foreground">
            No {scope.toLowerCase()} trips
            {month ? ` for ${month}` : ""} right now — try another month.
          </div>
        ) : (
          <div
            ref={railRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {trips.map((trip, i) => (
              <TripCard key={trip.slug} trip={trip} index={i} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/#showcase"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ScopeToggle({
  scope,
  onChange,
}: {
  scope: Scope;
  onChange: (s: Scope) => void;
}) {
  return (
    <div className="flex rounded-full bg-muted p-1">
      {(["Domestic", "International"] as Scope[]).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className="relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          {scope === s && (
            <motion.span
              layoutId="scope-toggle"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            />
          )}
          <span
            className={
              scope === s
                ? "relative text-primary-foreground"
                : "relative text-muted-foreground hover:text-foreground"
            }
          >
            {s}
          </span>
        </button>
      ))}
    </div>
  );
}

function MonthPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-transparent text-foreground/70 hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function RailButton({
  dir,
  onClick,
  label,
}: {
  dir: number;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
    >
      {dir < 0 ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </button>
  );
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const href = trip.destinationSlug
    ? `/destinations/${trip.destinationSlug}`
    : "/plan";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 4) * 0.06, duration: 0.4 }}
      className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
    >
      <Link
        href={href}
        className="group relative block aspect-[4/5] overflow-hidden rounded-3xl shadow-sm transition-shadow hover:shadow-xl"
      >
        <Image
          src={trip.image}
          alt={trip.title}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

        {trip.badge && (
          <span className="absolute right-3 top-3 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white shadow">
            {trip.badge}
          </span>
        )}

        {/* Overlaid details */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight">
            {trip.title}
          </h3>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] backdrop-blur">
            <MapPin className="h-3 w-3" />
            {trip.route}
          </span>

          <div className="my-3 h-px bg-white/25" />

          <div className="flex items-center gap-3 text-[11px] text-white/85">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {trip.duration}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {trip.months}
            </span>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div className="leading-none">
              {trip.oldPrice && (
                <span className="mr-1.5 text-xs text-white/60 line-through">
                  {formatINR(trip.oldPrice)}
                </span>
              )}
              <span className="text-xl font-extrabold">
                {formatINR(trip.price)}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {trip.rating}
              <span className="text-white/60">({trip.reviews})</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
