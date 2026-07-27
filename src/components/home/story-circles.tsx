"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { STORIES } from "@/lib/trips";
import { cn } from "@/lib/utils";

/** Instagram-style story circles with animated gradient rings. */
export function StoryCircles() {
  return (
    <section className="relative z-20 -mt-10">
      <div className="container">
        <div className="no-scrollbar flex gap-14 overflow-x-auto rounded-full border border-border/60 bg-background/90 px-6 py-4 shadow-xl backdrop-blur-xl">
          {STORIES.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={s.href}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "grid place-items-center rounded-full p-[3px]",
                    s.highlight
                      ? "bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400"
                      : "bg-gradient-to-tr from-secondary via-accent to-primary",
                  )}
                >
                  <span className="rounded-full bg-background p-[2px]">
                    <span className="relative block h-14 w-14 overflow-hidden rounded-full">
                      <Image
                        src={s.image}
                        alt={s.label}
                        fill
                        sizes="56px"
                        className="object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "line-clamp-1 text-center text-[11px] font-medium",
                    s.highlight ? "text-emerald-600" : "text-foreground/80",
                  )}
                >
                  {s.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
