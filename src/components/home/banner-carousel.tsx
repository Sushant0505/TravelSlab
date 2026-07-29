"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BannerSlide } from "./banner-slide";
import { DEFAULT_BANNERS, type BannerDTO } from "@/lib/banners";

export function BannerCarousel() {
  // Start with the built-in banners so the section paints instantly, then
  // swap in whatever the admin has configured via /api/banners.
  const [banners, setBanners] = useState<BannerDTO[]>(DEFAULT_BANNERS);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/banners")
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !Array.isArray(d?.banners) || d.banners.length === 0) return;
        setBanners(d.banners);
        setActive(0);
      })
      .catch(() => {
        /* keep defaults on error */
      });
    return () => {
      alive = false;
    };
  }, []);

  const count = banners.length;

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  // Auto-advance; pauses while the tab is hidden.
  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <section className="pt-8 md:pt-12">
      <div className="container">
        <div className="group relative overflow-hidden rounded-3xl shadow-lg">
          <motion.div
            className="flex"
            animate={{ x: `-${active * 100}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {banners.map((b) => (
              <div key={b.id} className="min-w-full">
                <BannerSlide banner={b} />
              </div>
            ))}
          </motion.div>

          {/* Prev / next — appear on hover, always available via keyboard */}
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 opacity-0 shadow-md backdrop-blur transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next banner"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-slate-800 opacity-0 shadow-md backdrop-blur transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-label={`Go to banner ${i + 1}`}
                    aria-current={active === i}
                    onClick={() => setActive(i)}
                    className={`h-2 rounded-full transition-all ${
                      active === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
