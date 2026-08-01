"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, CalendarDays, Check, ArrowRight, Tag } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { PublicPackage } from "@/server/package-repo";

/**
 * Compact horizontal package card (justwravel-style) for destination listings:
 * fixed-size cover image on the left (portraits crop cleanly), details + price
 * on the right. Shows nothing about the agency.
 */
export function PackageListCard({ pkg, index = 0 }: { pkg: PublicPackage; index?: number }) {
  const nextDate = pkg.dates
    .map((d) => new Date(d))
    .filter((d) => d.getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 4) * 0.05, duration: 0.4 }}
    >
      <Link
        href={`/trips/${pkg.slug}`}
        className="group flex overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="relative w-32 shrink-0 overflow-hidden sm:w-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pkg.heroImage}
            alt={pkg.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {pkg.slabLabel && (
            <span className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-800 backdrop-blur">
              {pkg.slabLabel}
            </span>
          )}
          {pkg.featured && (
            <span className="absolute bottom-2 left-2 rounded-full bg-secondary/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              Featured
            </span>
          )}
        </div>

        <div className="flex min-h-[150px] flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
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
            {pkg.typeLabel && (
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> {pkg.typeLabel}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 font-display text-base font-bold leading-snug group-hover:text-primary sm:text-lg">
            {pkg.name}
          </h3>

          {pkg.highlights.length > 0 && (
            <ul className="mt-2 hidden gap-x-4 gap-y-1 sm:flex sm:flex-wrap">
              {pkg.highlights.slice(0, 3).map((h, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="line-clamp-1">{h}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex items-end justify-between pt-3">
            <div>
              <div className="text-[11px] text-muted-foreground">Starting from</div>
              <div className="font-display text-lg font-bold">
                {formatINR(pkg.price)}
                <span className="text-xs font-normal text-muted-foreground"> /person</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              View <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
