"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, Star, MapPin, ArrowRight } from "lucide-react";
import { tripsByCategory, type Trip, type TripCategory } from "@/lib/trips";
import { formatINR } from "@/lib/utils";
import { SectionHead } from "./section-head";

const TABS: TripCategory[] = [
  "New Launches",
  "International",
  "India",
  "Group Trips",
];

export function TripShowcase() {
  const [tab, setTab] = useState<TripCategory>("New Launches");
  const trips = tripsByCategory(tab).slice(0, 4);

  return (
    <section id="showcase" className="pt-12 md:pt-16">
      <div className="container">
        <SectionHead
          eyebrow="Curated trips"
          title="Handpicked departures"
          subtitle="Fixed group departures with the best-rated itineraries. Tap any trip to plan yours."
        />

        {/* Tabs */}
        <div className="mx-auto mb-10 flex w-fit flex-wrap justify-center gap-1 rounded-full bg-muted p-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="relative rounded-full px-4 py-2 text-sm font-semibold transition-colors"
            >
              {tab === t && (
                <motion.span
                  layoutId="trip-tab"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span
                className={
                  tab === t
                    ? "relative text-white"
                    : "relative text-muted-foreground hover:text-foreground"
                }
              >
                {t}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {trips.map((trip, i) => (
              <TripCard key={trip.slug} trip={trip} index={i} />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-105"
          >
            View all trips <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const href = trip.destinationSlug
    ? `/destinations/${trip.destinationSlug}`
    : "/plan";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link
        href={href}
        className="group block overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={trip.image}
            alt={trip.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

          {trip.badge && (
            <span className="absolute right-3 top-3 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-white">
              {trip.badge}
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="font-display text-lg font-bold leading-tight">
              {trip.title}
            </h3>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] backdrop-blur">
              <MapPin className="h-3 w-3" />
              {trip.route}
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {trip.duration}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {trip.months}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              {trip.oldPrice && (
                <span className="mr-1.5 text-xs text-muted-foreground line-through">
                  {formatINR(trip.oldPrice)}
                </span>
              )}
              <span className="text-lg font-bold text-foreground">
                {formatINR(trip.price)}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {trip.rating}
              <span className="text-muted-foreground">({trip.reviews})</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
