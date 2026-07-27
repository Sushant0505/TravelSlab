"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import { SLABS } from "@/lib/slabs";
import { StatCounter } from "./stat-counter";

// Demo live-lead counts. In production these come from React Query
// hitting /api/slabs/counts (backed by Redis).
const LIVE_COUNTS: Record<string, number> = {
  s0_5k: 312,
  s5_10k: 894,
  s10_20k: 1207,
  s20_50k: 1583,
  s50_100k: 642,
  s100k_plus: 208,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function BudgetSlabs() {
  return (
    <section id="slabs" className="relative py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh opacity-60" />
      <div className="container">
        <SectionHead
          eyebrow="Budget slabs"
          title="Every budget has a slab"
          subtitle="Leads are auto-sorted into budget bands. Agencies buy exactly the tier they want — and you get matched with experts who fit your wallet."
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SLABS.map((slab) => (
            <motion.div key={slab.id} variants={item}>
              <Link
                href="/plan"
                className="group relative block overflow-hidden rounded-3xl p-[1.5px]"
              >
                {/* Gradient border */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${slab.gradient} opacity-70 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative h-full rounded-[calc(1.5rem-1.5px)] bg-card/95 p-6 backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <span
                      className={`bg-gradient-to-br ${slab.gradient} bg-clip-text font-display text-2xl font-bold text-transparent`}
                    >
                      {slab.label}
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <StatCounter
                      to={LIVE_COUNTS[slab.id] ?? 0}
                      className="font-semibold text-foreground"
                    />
                    live leads available
                  </div>

                  <div className="mt-5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Trending
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slab.trending.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    Agency unlock price:{" "}
                    <span className="font-semibold text-foreground">
                      ₹{slab.leadPrice}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto mb-14 max-w-2xl text-center"
    >
      <span className="text-sm font-semibold uppercase tracking-widest text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-muted-foreground">{subtitle}</p>
      )}
    </motion.div>
  );
}
