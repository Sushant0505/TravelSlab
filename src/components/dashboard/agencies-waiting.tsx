"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Animated "agencies waiting" trust signal for traveler trip cards.
 *
 * `waiting` = verified agencies in the network that could still pick up this
 * lead (total approved − those who already unlocked it). Shows a live pulse,
 * a count-up number and a looping activity bar so the dashboard feels alive.
 */
export function AgenciesWaiting({
  waiting,
  destination,
  className,
}: {
  waiting: number;
  destination?: string;
  className?: string;
}) {
  const target = Math.max(0, waiting);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [target]);

  return (
    <div className={cn("inline-flex min-w-[9.5rem] flex-col gap-1.5", className)}>
      <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
        {/* live pulse */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-bold text-emerald-700">
          {target > 0 ? (
            <>
              {display}
              <span className="text-emerald-500">+</span> agencies waiting
            </>
          ) : (
            "Notifying agencies"
          )}
        </span>
      </div>

      {/* looping activity bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
          initial={{ width: "20%" }}
          animate={{ width: ["20%", "85%", "45%", "95%", "30%"] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {destination && (
        <p className="text-[11px] leading-tight text-slate-400">
          Trusted agencies ready to plan your{" "}
          <span className="font-medium text-slate-500">{destination}</span> trip
        </p>
      )}
    </div>
  );
}
