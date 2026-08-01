"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, CalendarClock, Clock, Sparkles, Layers } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { PackageListCard } from "@/components/packages/package-list-card";
import { PlanTripButton } from "./plan-trip-button";
import type { PublicPackage } from "@/server/package-repo";

interface TierView {
  id: string;
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
}

/**
 * The destination "book" block: a sticky left pricing card with budget-slab
 * selection + the auto-injected approved packages on the right, filtered by the
 * selected slab. Agency identity never appears here.
 */
export function DestinationPackages({
  destinationName,
  baselineStartingFrom,
  bestTime,
  idealDuration,
  packages,
  tiers,
}: {
  destinationName: string;
  baselineStartingFrom: number;
  bestTime: string;
  idealDuration: string;
  packages: PublicPackage[];
  tiers: TierView[];
}) {
  const [slab, setSlab] = useState<string | null>(null);

  const startingFrom = useMemo(() => {
    const prices = packages.map((p) => p.price).filter((n) => n > 0);
    if (!prices.length) return baselineStartingFrom;
    return Math.min(...prices);
  }, [packages, baselineStartingFrom]);

  // Only surface slabs that actually contain packages here.
  const slabBuckets = useMemo(() => {
    return tiers
      .map((t) => ({
        tier: t,
        items: packages.filter(
          (p) => p.price >= t.minPerHead && (t.maxPerHead == null || p.price < t.maxPerHead),
        ),
      }))
      .filter((b) => b.items.length > 0);
  }, [tiers, packages]);

  const visible = useMemo(() => {
    if (!slab) return packages;
    const bucket = slabBuckets.find((b) => b.tier.id === slab);
    return bucket ? bucket.items : [];
  }, [slab, packages, slabBuckets]);

  const selectedLabel = slabBuckets.find((b) => b.tier.id === slab)?.tier.label;

  return (
    <section id="packages" className="border-t border-border/60 bg-muted/20 py-14">
      <div className="container grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left pricing / slab card */}
        <aside className="lg:pr-2">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" /> Starting from
              </div>
              <div className="mt-1 font-display text-3xl font-bold">
                {formatINR(startingFrom)}
                <span className="text-base font-normal text-muted-foreground"> /person</span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Best time:</span>
                  <span className="font-medium">{bestTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Ideal duration:</span>
                  <span className="font-medium">{idealDuration}</span>
                </div>
              </div>

              {slabBuckets.length > 0 && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Layers className="h-3.5 w-3.5" /> Available packages
                  </div>
                  <div className="space-y-1.5">
                    <SlabRow
                      active={slab === null}
                      label="All budgets"
                      count={packages.length}
                      onClick={() => setSlab(null)}
                    />
                    {slabBuckets.map((b) => (
                      <SlabRow
                        key={b.tier.id}
                        active={slab === b.tier.id}
                        label={b.tier.label}
                        count={b.items.length}
                        onClick={() => setSlab(b.tier.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <PlanTripButton
                  destination={destinationName}
                  perHeadBudget={startingFrom}
                  label="Plan this trip"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[position:right_center]"
                />
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Free for travellers · agencies compete for your trip
              </p>
            </div>
          </div>
        </aside>

        {/* Packages grid */}
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-2xl font-bold">{destinationName} packages</h2>
              <p className="text-sm text-muted-foreground">
                {selectedLabel
                  ? `${visible.length} package${visible.length === 1 ? "" : "s"} under ${selectedLabel}`
                  : `${packages.length} curated package${packages.length === 1 ? "" : "s"} · pick a budget on the left`}
              </p>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyPackages destinationName={destinationName} perHeadBudget={startingFrom} />
          ) : (
            <motion.div layout className="space-y-4">
              {visible.map((p, i) => (
                <PackageListCard key={p.id} pkg={p} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

function SlabRow({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
        active
          ? "border-primary bg-primary/10 font-semibold text-primary"
          : "border-border/60 hover:bg-muted"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyPackages({
  destinationName,
  perHeadBudget,
}: {
  destinationName: string;
  perHeadBudget: number;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="mt-3 font-display text-lg font-semibold">
        No packages in this budget yet
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Plan a custom {destinationName} trip and verified agencies will send you
        tailored itineraries to compare — free for travellers.
      </p>
      <div className="mt-5 flex justify-center">
        <PlanTripButton destination={destinationName} perHeadBudget={perHeadBudget} label={`Plan a ${destinationName} trip`} />
      </div>
    </div>
  );
}
