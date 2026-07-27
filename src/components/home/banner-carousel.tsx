"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  /** Highlighted trailing word/phrase of the title. */
  accent: string;
  subtitle: string;
  discount?: string;
  cta: string;
  href: string;
  /** Tailwind gradient classes for the banner background. */
  gradient: string;
  /** Three "airplane window" images shown on the right. */
  images: string[];
}

const BANNERS: Banner[] = [
  {
    id: "bucket-list-sale",
    eyebrow: "From wishlist to window seat",
    title: "The Bucket List Sale is",
    accent: "LIVE",
    subtitle: "Book your dream departure now and save on India's most-loved trips.",
    discount: "Discount up to ₹5,000*",
    cta: "View all packages",
    href: "/#upcoming-trips",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    images: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80",
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
    ],
  },
  {
    id: "international-escapes",
    eyebrow: "Passport-ready getaways",
    title: "International trips from",
    accent: "₹38,999",
    subtitle: "Bali, Thailand & Vietnam group departures with verified partners.",
    discount: "Zero-cost EMI available",
    cta: "Explore international",
    href: "/#upcoming-trips",
    gradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
    images: [
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80",
    ],
  },
  {
    id: "group-departures",
    eyebrow: "Solo-friendly · fixed dates",
    title: "Join a group trip to",
    accent: "the Himalayas",
    subtitle: "Ladakh, Spiti & Zanskar backpacking with like-minded travellers.",
    discount: "Limited slots per batch",
    cta: "See group trips",
    href: "/#upcoming-trips",
    gradient: "from-orange-500 via-rose-500 to-pink-600",
    images: [
      "https://images.unsplash.com/photo-1589793907316-f94025b46850?w=600&q=80",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80",
    ],
  },
];

export function BannerCarousel() {
  const [active, setActive] = useState(0);
  const count = BANNERS.length;

  const go = useCallback(
    (dir: number) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  // Auto-advance; pauses while the tab is hidden.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((i) => (i + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [count]);

  return (
    <section className="pt-8 md:pt-12">
      <div className="container">
        <div className="group relative overflow-hidden rounded-3xl shadow-lg">
          <motion.div
            className="flex"
            animate={{ x: `-${active * 100}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {BANNERS.map((b) => (
              <div key={b.id} className="min-w-full">
                <Slide banner={b} />
              </div>
            ))}
          </motion.div>

          {/* Prev / next — appear on hover, always available via keyboard */}
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
            {BANNERS.map((b, i) => (
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
        </div>
      </div>
    </section>
  );
}

function Slide({ banner }: { banner: Banner }) {
  return (
    <div
      className={`relative flex items-center justify-between gap-4 overflow-hidden bg-gradient-to-r ${banner.gradient} px-6 py-7 md:px-10 md:py-9`}
    >
      {/* Watermark wordmark, echoing the reference banner */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none truncate text-center font-display text-4xl font-black uppercase tracking-widest text-white/10 md:text-6xl"
      >
        TripSlab · TripSlab
      </span>

      {/* Copy */}
      <div className="relative z-10 min-w-0 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
          {banner.eyebrow}
        </span>
        <h2 className="mt-2 font-display text-xl font-black leading-tight sm:text-2xl md:text-3xl">
          {banner.title}{" "}
          <span className="ml-0.5 inline-block rounded-lg bg-amber-300 px-2 py-0.5 text-slate-900 shadow-sm">
            {banner.accent}
          </span>
        </h2>
        {banner.discount && (
          <p className="mt-2 hidden text-sm font-bold uppercase tracking-wide text-white/95 sm:block">
            {banner.discount}
          </p>
        )}
      </div>

      {/* Right: image collage + CTA */}
      <div className="relative z-10 flex shrink-0 items-center gap-3 md:gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          {banner.images.map((src) => (
            <div
              key={src}
              className="relative aspect-[3/4] w-14 overflow-hidden rounded-xl ring-2 ring-white/40 md:w-16"
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
        <Link
          href={banner.href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-105"
        >
          {banner.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
