"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { SectionHead } from "./section-head";
import { PackageCard } from "@/components/packages/package-card";
import type { PublicPackage } from "@/server/package-repo";

interface TypeOpt { id: string; name: string; slug: string }

/**
 * Handpicked departures — admin-featured approved packages, grouped by the
 * agency-chosen trip type. Fully dynamic: an admin "features" a package to show
 * it here; the section hides itself until at least one is featured.
 */
export function TripShowcase() {
  const { data: pkgData, isLoading } = useQuery({
    queryKey: ["packages-featured"],
    queryFn: async (): Promise<{ packages: PublicPackage[] }> =>
      (await fetch("/api/packages?featured=1&limit=12")).json(),
    staleTime: 30_000,
  });
  const { data: typeData } = useQuery({
    queryKey: ["trip-types-public"],
    queryFn: async (): Promise<{ types: TypeOpt[] }> => (await fetch("/api/trip-types")).json(),
    staleTime: 60_000,
  });

  const [tab, setTab] = useState<string | null>(null);
  const packages = pkgData?.packages ?? [];
  const typesWithPackages = (typeData?.types ?? []).filter((t) =>
    packages.some((p) => p.typeId === t.id),
  );
  const visible = (tab ? packages.filter((p) => p.typeId === tab) : packages).slice(0, 8);
  const selectedType = typesWithPackages.find((t) => t.id === tab);

  // Nothing featured yet → don't render an empty section.
  if (!isLoading && packages.length === 0) return null;

  return (
    <section id="showcase" className="pt-12 md:pt-16">
      <div className="container">
        <SectionHead
          eyebrow="Curated trips"
          title="Handpicked departures"
          subtitle="Featured departures from verified agencies. Tap any trip to see the full itinerary."
        />

        {typesWithPackages.length > 0 && (
          <div className="mx-auto mb-10 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-full bg-muted p-1.5">
            <Tab active={tab === null} onClick={() => setTab(null)}>All</Tab>
            {typesWithPackages.map((t) => (
              <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
                {t.name}
              </Tab>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-3xl border border-border/60 bg-card" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" />
            No featured trips in this category yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((p, i) => (
              <PackageCard key={p.id} pkg={p} index={i} showDestination />
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {selectedType && (
            <Link
              href={`/categories/${selectedType.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              View all {selectedType.name} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-105"
          >
            Plan your own trip <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Tab({
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
      className="relative rounded-full px-4 py-2 text-sm font-semibold transition-colors"
    >
      {active && (
        <motion.span
          layoutId="trip-tab"
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className={active ? "relative text-white" : "relative text-muted-foreground hover:text-foreground"}>
        {children}
      </span>
    </button>
  );
}
