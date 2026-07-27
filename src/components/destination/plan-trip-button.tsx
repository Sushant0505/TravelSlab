"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { usePlanner } from "@/store/planner";

/**
 * Seeds the planner with this destination and jumps the user into the
 * trip-details step of the planner.
 */
export function PlanTripButton({
  destination,
  className,
  label,
}: {
  destination: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const set = usePlanner((s) => s.set);

  function go() {
    set({ destination, step: 1 });
    router.push("/plan");
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={go}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[position:right_center]"
      }
    >
      <Sparkles className="h-4 w-4" />
      {label ?? `Plan a trip to ${destination}`}
    </motion.button>
  );
}
