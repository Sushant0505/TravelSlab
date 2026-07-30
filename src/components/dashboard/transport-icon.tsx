"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, Car, CarTaxiFront, Bus, TrainFront, Ship } from "lucide-react";

// The travel modes we cycle through in the trip-card icon.
const MODES = [Plane, Car, CarTaxiFront, Bus, TrainFront, Ship];

/**
 * A single icon that continuously rotates through travel modes
 * (plane → car → taxi → bus → train → ship) with a playful swap animation.
 * `offset` lets stacked cards fall out of sync so the grid feels alive.
 */
export function TransportIcon({
  className = "h-5 w-5",
  interval = 1900,
  offset = 0,
}: {
  className?: string;
  interval?: number;
  offset?: number;
}) {
  const [i, setI] = useState(offset % MODES.length);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % MODES.length), interval);
    return () => clearInterval(id);
  }, [interval]);

  const Icon = MODES[i];

  return (
    <span className="relative inline-grid h-[1.25em] w-[1.25em] place-items-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 7, rotate: -35, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, y: -7, rotate: 35, scale: 0.5 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inline-grid place-items-center"
        >
          <Icon className={className} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
