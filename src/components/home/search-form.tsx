"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, PlaneTakeoff, Users, Wallet, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/store/planner";
import { DESTINATIONS, TRIP_TYPES } from "@/lib/destinations";
import { formatINR } from "@/lib/utils";

/**
 * Hero quick-search. Seeds the planner store and routes to /plan (step 2),
 * so the user lands mid-flow with their choices pre-filled.
 *
 * `variant`:
 *   - "panel" (default): vertical card, sits on the left of the hero.
 *   - "bar": wide horizontal row of fields.
 */
export function SearchForm({ variant = "panel" }: { variant?: "panel" | "bar" }) {
  const router = useRouter();
  const { set, budget, travelers } = usePlanner();

  const perHead = travelers > 0 ? Math.round(budget / travelers) : budget;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Jump into the planner at the trip-details step.
    set({ step: 1 });
    router.push("/plan");
  }

  const fields = (
    <>
      <Field icon={<MapPin className="h-4 w-4" />} label="Destination">
        <select
          className="w-full bg-transparent text-sm font-medium outline-none"
          onChange={(e) => set({ destination: e.target.value })}
          defaultValue=""
        >
          <option value="" disabled>
            Where to?
          </option>
          {DESTINATIONS.map((d) => (
            <option key={d.slug} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field icon={<PlaneTakeoff className="h-4 w-4" />} label="From">
        <input
          type="text"
          placeholder="Departure city"
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          onChange={(e) => set({ departureCity: e.target.value })}
        />
      </Field>

      <Field icon={<Users className="h-4 w-4" />} label="Travelers">
        <input
          type="number"
          min={1}
          max={40}
          defaultValue={travelers}
          className="w-full bg-transparent text-sm font-medium outline-none"
          onChange={(e) => set({ travelers: Number(e.target.value) || 1 })}
        />
      </Field>

      <Field icon={<Wallet className="h-4 w-4" />} label="Budget (total)">
        <input
          type="number"
          min={0}
          step={1000}
          defaultValue={budget}
          className="w-full bg-transparent text-sm font-medium outline-none"
          onChange={(e) => set({ budget: Number(e.target.value) || 0 })}
        />
      </Field>

      <Field icon={<Calendar className="h-4 w-4" />} label="Travel date">
        <input
          type="date"
          className="w-full bg-transparent text-sm font-medium outline-none"
          onChange={(e) => set({ travelDate: e.target.value })}
        />
      </Field>

      <Field icon={<Sparkles className="h-4 w-4" />} label="Trip type">
        <select
          className="w-full bg-transparent text-sm font-medium outline-none"
          onChange={(e) => set({ tripType: e.target.value as never })}
          defaultValue=""
        >
          <option value="" disabled>
            Choose
          </option>
          {TRIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
    </>
  );

  if (variant === "bar") {
    return (
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card mx-auto w-full max-w-5xl rounded-3xl p-4 md:p-6"
      >
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">{fields}</div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            ≈ <span className="font-semibold text-primary">{formatINR(perHead)}</span>{" "}
            per traveler
          </p>
          <Button type="submit" variant="gradient" size="lg" className="w-full sm:w-auto">
            <Sparkles className="h-4 w-4" />
            Plan My Dream Trip
          </Button>
        </div>
      </motion.form>
    );
  }

  // Vertical panel — sits on the left of the hero.
  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card w-full rounded-3xl p-5 text-left md:p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-base font-bold leading-none">
            Plan in 30 seconds
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Free · no signup to get matched
          </p>
        </div>
      </div>

      <div className="grid gap-3">{fields}</div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          ≈ <span className="font-semibold text-primary">{formatINR(perHead)}</span>{" "}
          / traveler
        </p>
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="mt-3 w-full"
      >
        <Sparkles className="h-4 w-4" />
        Plan My Dream Trip
      </Button>
    </motion.form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl bg-background/60 p-3 ring-1 ring-border/60 transition-colors focus-within:ring-primary">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
