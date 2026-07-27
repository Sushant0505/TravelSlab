"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MapPin, Flame } from "lucide-react";
import { DESTINATIONS, type Destination } from "@/lib/destinations";
import { getSlab, type SlabId } from "@/lib/slabs";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BudgetFilter, DESTINATIONS_BY_SLAB } from "./budget-filter";

export function PopularDestinations() {
  const [slab, setSlab] = useState<SlabId | null>(null);
  const visible = slab ? DESTINATIONS_BY_SLAB[slab] : DESTINATIONS;

  return (
    <section id="destinations" className="py-16 md:py-20">
      <div className="container">
        {/* Left-aligned header so it sits naturally above the filter + grid */}
        <div className="mb-8 max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Popular right now
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Where India is heading
          </h2>
          <p className="mt-3 text-muted-foreground">
            Filter by budget slab, then tap any destination to start a plan.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <BudgetFilter selected={slab} onSelect={setSlab} />

          <div>
            {slab && (
              <p className="mb-4 text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {visible.length}
                </span>{" "}
                {visible.length === 1 ? "destination" : "destinations"} under{" "}
                <span className="font-semibold text-foreground">
                  {getSlab(slab).label}
                </span>{" "}
                per traveler.
              </p>
            )}

            {visible.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center">
                <p className="font-display text-lg font-semibold">
                  No destinations in this slab yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a higher budget band — or plan a custom trip and let
                  agencies quote for it.
                </p>
                <Button
                  variant="gradient"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSlab(null)}
                >
                  Show all budgets
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {visible.map((d, i) => (
                  <TiltCard key={d.slug} d={d} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TiltCard({ d, index }: { d: Destination; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.a
      ref={ref}
      href={`/destinations/${d.slug}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: (index % 4) * 0.06, duration: 0.5 }}
      className="group relative block aspect-[3/4] overflow-hidden rounded-3xl [transform-style:preserve-3d]"
    >
      <Image
        src={d.image}
        alt={d.name}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      {/* Animated overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
      <div className="absolute inset-0 bg-primary/0 transition-colors duration-500 group-hover:bg-primary/10" />

      {d.trending && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <Flame className="h-3 w-3" /> Trending
        </span>
      )}

      <div
        className="absolute inset-x-0 bottom-0 p-4 text-white"
        style={{ transform: "translateZ(40px)" }}
      >
        <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-white/70">
          <MapPin className="h-3 w-3" />
          {d.region}
        </div>
        <h3 className="mt-0.5 font-display text-xl font-bold">{d.name}</h3>
        <p className="text-xs text-white/75">{d.tagline}</p>
        <div className="mt-2 translate-y-2 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          From {formatINR(d.startingFrom)}
          <span className="text-white/60"> /person</span>
        </div>
      </div>
    </motion.a>
  );
}
