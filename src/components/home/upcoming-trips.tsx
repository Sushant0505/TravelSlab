"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { MONTH_PILLS } from "@/lib/trips";
import { PackageCard } from "@/components/packages/package-card";
import type { PublicPackage } from "@/server/package-repo";

type Scope = "Domestic" | "International";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface DestScope { slug: string; scope: "India" | "World" }

/**
 * Upcoming Trips — dynamic rail of approved agency packages, filtered by
 * Domestic/International (via the destination's scope) and travel month (via the
 * package's departure dates). Any approved package appears here automatically.
 */
export function UpcomingTrips() {
  const { data: pkgData, isLoading } = useQuery({
    queryKey: ["packages-home"],
    queryFn: async (): Promise<{ packages: PublicPackage[] }> =>
      (await fetch("/api/packages?limit=40")).json(),
    staleTime: 30_000,
  });
  const { data: destData } = useQuery({
    queryKey: ["destinations-public"],
    queryFn: async (): Promise<{ destinations: DestScope[] }> =>
      (await fetch("/api/destinations")).json(),
    staleTime: 60_000,
  });

  const [scope, setScope] = useState<Scope>("Domestic");
  const [month, setMonth] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const packages = pkgData?.packages ?? [];
  const scopeBySlug = useMemo(() => {
    const m = new Map<string, "India" | "World">();
    for (const d of destData?.destinations ?? []) m.set(d.slug, d.scope);
    return m;
  }, [destData]);

  const trips = useMemo(() => {
    const want = scope === "Domestic" ? "India" : "World";
    const mIdx = month ? MONTHS.indexOf(month) : -1;
    return packages.filter((p) => {
      const s = scopeBySlug.get(p.destinationSlug) ?? "India";
      if (s !== want) return false;
      if (mIdx >= 0 && !p.dates.some((d) => new Date(d).getMonth() === mIdx)) return false;
      return true;
    });
  }, [packages, scopeBySlug, scope, month]);

  function scrollBy(dir: number) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * (rail.clientWidth * 0.9), behavior: "smooth" });
  }

  // No approved packages at all → hide the section until agencies add trips.
  if (!isLoading && packages.length === 0) return null;

  return (
    <section id="upcoming-trips" className="py-12 md:py-16">
      <div className="container">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Upcoming Trips</h2>
          <div className="flex items-center gap-3">
            <ScopeToggle scope={scope} onChange={setScope} />
            <div className="hidden items-center gap-2 sm:flex">
              <RailButton dir={-1} onClick={() => scrollBy(-1)} label="Scroll left" />
              <RailButton dir={1} onClick={() => scrollBy(1)} label="Scroll right" />
            </div>
          </div>
        </div>

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

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 w-[80%] shrink-0 animate-pulse rounded-3xl border border-border/60 bg-card sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 py-16 text-center text-muted-foreground">
            No {scope.toLowerCase()} trips{month ? ` for ${month}` : ""} right now — try another month or region.
          </div>
        ) : (
          <div
            ref={railRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {trips.map((p, i) => (
              <div
                key={p.id}
                className="w-[80%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
              >
                <PackageCard pkg={p} index={i} showDestination />
              </div>
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

function ScopeToggle({ scope, onChange }: { scope: Scope; onChange: (s: Scope) => void }) {
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
          <span className={scope === s ? "relative text-primary-foreground" : "relative text-muted-foreground hover:text-foreground"}>
            {s}
          </span>
        </button>
      ))}
    </div>
  );
}

function MonthPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function RailButton({ dir, onClick, label }: { dir: number; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
    >
      {dir < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
