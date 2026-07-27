"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { Plane, Compass, Cloud } from "lucide-react";
import { SearchForm } from "./search-form";
import { StatCounter } from "./stat-counter";
import { RotatingWord } from "./rotating-word";

const ROTATING = [
  "Bali",
  "Ladakh",
  "Kashmir",
  "Thailand",
  "Dubai",
  "Vietnam",
  "Meghalaya",
  "Goa",
];

const SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1589793907316-f94025b46850?w=1920&q=80",
    place: "Leh Ladakh",
    caption: "Ride through the world's highest passes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920&q=80",
    place: "Bali",
    caption: "Where rice terraces meet the ocean",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1920&q=80",
    place: "Goa",
    caption: "Sun, sand and endless shacks",
  },
  {
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80",
    place: "Dubai",
    caption: "A skyline that touches the desert",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);
  const { scrollY } = useScroll();
  // Parallax: background drifts slower than foreground content.
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);
  const contentY = useTransform(scrollY, [0, 600], [0, -60]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      5000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
      {/* Rotating backgrounds with fade + slow zoom */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        <AnimatePresence mode="sync">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={SLIDES[index].image}
              alt={SLIDES[index].place}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        {/* Readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/80" />
      </motion.div>

      {/* Floating travel elements + drifting clouds */}
      <FloatingElements />

      {/* Foreground */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container relative z-10 grid items-center gap-10 pt-28 pb-16 lg:grid-cols-[1fr_minmax(340px,400px)] lg:gap-14"
      >
        {/* Left: headline, copy + stats */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md ring-1 ring-white/20"
          >
            <Compass className="h-4 w-4" />
            India&apos;s smartest way to plan &amp; get matched
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-6xl md:text-7xl"
          >
            Plan your trip to
            <br />
            <RotatingWord words={ROTATING} interval={5000} className="text-gradient" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto mt-5 max-w-xl text-lg text-white/80 lg:mx-0"
          >
            Tell us where, when and your budget. We match you with verified travel
            agencies who compete to craft your perfect itinerary — free for you.
          </motion.p>

          {/* Rotating caption */}
          <div className="mt-3 h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm font-medium uppercase tracking-widest text-primary"
              >
                {SLIDES[index].place} — {SLIDES[index].caption}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Live stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-6 text-white sm:gap-10 lg:mx-0"
          >
            <Stat value={<StatCounter to={48200} suffix="+" />} label="Trips planned" />
            <Stat value={<StatCounter to={1240} suffix="+" />} label="Verified agencies" />
            <Stat value={<StatCounter to={96} suffix="%" />} label="Match rate" />
          </motion.div>
        </div>

        {/* Right: search panel */}
        <div className="w-full">
          <SearchForm variant="panel" />
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/40 p-1">
          <motion.span
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="h-2 w-1 rounded-full bg-white"
          />
        </div>
      </motion.div>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-bold sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/70">
        {label}
      </div>
    </div>
  );
}

function FloatingElements() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -14, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute left-[8%] top-[24%] text-white/30"
      >
        <Plane className="h-10 w-10 -rotate-45" />
      </motion.div>
      <motion.div
        animate={{ x: [0, -40, 0] }}
        transition={{ repeat: Infinity, duration: 26, ease: "linear" }}
        className="absolute right-[12%] top-[18%] text-white/20"
      >
        <Cloud className="h-16 w-16" />
      </motion.div>
      <motion.div
        animate={{ x: [0, 60, 0] }}
        transition={{ repeat: Infinity, duration: 34, ease: "linear" }}
        className="absolute left-[20%] top-[40%] text-white/15"
      >
        <Cloud className="h-24 w-24" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 18, 0] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
        className="absolute bottom-[22%] right-[18%] h-3 w-3 rounded-full bg-secondary/70 blur-[1px]"
      />
    </div>
  );
}
