"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { SlidersHorizontal, Package as PackageIcon } from "lucide-react";
import { PackageCard } from "@/components/packages/package-card";
import type { PublicPackage } from "@/server/package-repo";

interface TierView {
  id: string;
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
}
interface DestOpt { slug: string; name: string }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DURATIONS = [
  { label: "Any length", min: 0, max: 999 },
  { label: "Up to 3 days", min: 0, max: 3 },
  { label: "4–6 days", min: 4, max: 6 },
  { label: "7–9 days", min: 7, max: 9 },
  { label: "10+ days", min: 10, max: 999 },
];

export function PopularPackages() {
  const { data: pkgData, isLoading } = useQuery({
    queryKey: ["packages-popular"],
    queryFn: async (): Promise<{ packages: PublicPackage[] }> =>
      (await fetch("/api/packages?popular=1&limit=60")).json(),
    staleTime: 30_000,
  });
  const { data: tierData } = useQuery({
    queryKey: ["slab-tiers-public"],
    queryFn: async (): Promise<{ tiers: TierView[] }> => (await fetch("/api/slab-tiers")).json(),
    staleTime: 60_000,
  });
  const { data: destData } = useQuery({
    queryKey: ["destinations-public"],
    queryFn: async (): Promise<{ destinations: DestOpt[] }> => (await fetch("/api/destinations")).json(),
    staleTime: 60_000,
  });

  const packages = pkgData?.packages ?? [];
  const tiers = tierData?.tiers ?? [];
  const destinations = destData?.destinations ?? [];

  const [slab, setSlab] = useState<string | null>(null);
  const [dest, setDest] = useState<string>("");
  const [durIdx, setDurIdx] = useState(0);
  const [month, setMonth] = useState<string>("");

  const filtered = useMemo(() => {
    const tier = tiers.find((t) => t.id === slab);
    const dur = DURATIONS[durIdx];
    const mIdx = month ? MONTHS.indexOf(month) : -1;
    return packages.filter((p) => {
      if (tier && !(p.price >= tier.minPerHead && (tier.maxPerHead == null || p.price < tier.maxPerHead)))
        return false;
      if (dest && p.destinationSlug !== dest) return false;
      if (p.durationDays > 0 && (p.durationDays < dur.min || p.durationDays > dur.max)) return false;
      if (mIdx >= 0 && !p.dates.some((d) => new Date(d).getMonth() === mIdx)) return false;
      return true;
    });
  }, [packages, tiers, slab, dest, durIdx, month]);

  // Nothing to show yet (no agency packages approved) → don't render the section.
  if (!isLoading && packages.length === 0) return null;

  return (
    <section id="packages" className="border-t border-border/60 bg-muted/20 py-16 md:py-20">
      <div className="container">
        <div className="mb-8 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Ready to book
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Popular packages by budget
          </h2>
          <p className="mt-3 text-muted-foreground">
            Curated departures from verified agencies. Filter by budget, destination, length or month.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip active={slab === null} onClick={() => setSlab(null)}>
              All budgets
            </Chip>
            {tiers.map((t) => (
              <Chip key={t.id} active={slab === t.id} onClick={() => setSlab(t.id === slab ? null : t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Refine
            </span>
            <select value={dest} onChange={(e) => setDest(e.target.value)} className={selectCls}>
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.slug}>{d.name}</option>
              ))}
            </select>
            <select value={durIdx} onChange={(e) => setDurIdx(Number(e.target.value))} className={selectCls}>
              {DURATIONS.map((d, i) => (
                <option key={d.label} value={i}>{d.label}</option>
              ))}
            </select>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls}>
              <option value="">Any month</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl border border-border/60 bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <PackageIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 font-display text-lg font-semibold">No packages match these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a wider budget band, month or destination.</p>
          </div>
        ) : (
          <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.slice(0, 8).map((p, i) => (
              <PackageCard key={p.id} pkg={p} index={i} showDestination />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

const selectCls =
  "rounded-full border border-border/60 bg-card px-3 py-1.5 text-sm outline-none focus:border-primary";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-white"
          : "border border-border/60 bg-card text-foreground/80 hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
