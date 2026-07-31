"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, RotateCcw, ChevronDown, MapPin } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/lib/destinations";
import { formatINR, cn } from "@/lib/utils";

/** A slab range as shown in the filter (admin-managed). */
export interface TierView {
  id: string;
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
  leadPrice: number;
}

// Colour bar per range, cycled by position.
const GRADIENTS = [
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-purple-600",
  "from-fuchsia-400 to-pink-600",
  "from-orange-400 to-red-500",
  "from-amber-400 to-yellow-600",
];

/**
 * Left-rail budget filter. Ranges come from the admin's slab tiers; picking one
 * filters the destination grid and reveals the destinations under that budget.
 */
export function BudgetFilter({
  tiers,
  buckets,
  selected,
  onSelect,
}: {
  tiers: TierView[];
  buckets: Record<string, Destination[]>;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-3xl border border-border/60 bg-card/70 p-4 backdrop-blur-xl shadow-[0_18px_34px_-30px_rgba(14,18,38,0.75)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filters
          </div>
          {selected && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Budget slab
          <span className="ml-1 normal-case tracking-normal">(per traveler)</span>
        </span>

        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "mb-1.5 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
            selected === null
              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
              : "text-foreground/80 hover:bg-muted",
          )}
        >
          All budgets
          <span className="text-xs text-muted-foreground">{DESTINATIONS.length}</span>
        </button>

        <ul className="space-y-1.5">
          {tiers.map((tier, i) => {
            const list = buckets[tier.id] ?? [];
            const isOpen = selected === tier.id;

            return (
              <li key={tier.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => onSelect(isOpen ? null : tier.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-colors",
                    isOpen ? "bg-muted/80 ring-1 ring-border" : "hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b",
                      GRADIENTS[i % GRADIENTS.length],
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {tier.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {list.length === 0
                        ? "No destinations yet"
                        : `${list.length} destination${list.length > 1 ? "s" : ""}`}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180 text-primary",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <ul className="ml-4 mt-1.5 space-y-0.5 border-l border-border/60 pl-3">
                        {list.length === 0 && (
                          <li className="py-2 text-xs text-muted-foreground">
                            Nothing in this band yet — try a higher slab.
                          </li>
                        )}
                        {list.map((d) => (
                          <li key={d.slug}>
                            <Link
                              href={`/destinations/${d.slug}`}
                              className="group flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="truncate text-sm text-foreground/85 group-hover:text-foreground">
                                  {d.name}
                                </span>
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold text-primary">
                                {formatINR(d.startingFrom)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
