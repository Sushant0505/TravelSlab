"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin, Check, ArrowRight, CalendarDays } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { PublicPackage } from "@/server/package-repo";

/**
 * Traveller-facing package card. Deliberately shows NOTHING about the agency —
 * name, price, duration, highlights only. Links to the package detail page.
 */
export function PackageCard({
  pkg,
  index = 0,
  showDestination = false,
}: {
  pkg: PublicPackage;
  index?: number;
  showDestination?: boolean;
}) {
  const nextDate = pkg.dates
    .map((d) => new Date(d))
    .filter((d) => d.getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 3) * 0.06, duration: 0.45 }}
    >
      <Link
        href={`/trips/${pkg.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative aspect-[16/11] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pkg.heroImage}
            alt={pkg.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {pkg.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-secondary/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
              Featured
            </span>
          )}
          {pkg.slabLabel && (
            <span className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-800 backdrop-blur">
              {pkg.slabLabel}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          {showDestination && (
            <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3 w-3" /> {pkg.destinationName}
            </div>
          )}
          <h3 className="font-display text-lg font-bold leading-snug group-hover:text-primary">
            {pkg.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {pkg.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {pkg.duration}
              </span>
            )}
            {nextDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {nextDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>

          {pkg.highlights.length > 0 && (
            <ul className="mt-3 space-y-1">
              {pkg.highlights.slice(0, 2).map((h, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-1">{h}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <div className="text-[11px] text-muted-foreground">Starting from</div>
              <div className="font-display text-xl font-bold">
                {formatINR(pkg.price)}
                <span className="text-xs font-normal text-muted-foreground"> /person</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              View <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
