import type { Metadata } from "next";
import Link from "next/link";
import { Plane } from "lucide-react";
import { TripPlanner } from "@/components/planner/trip-planner";

export const metadata: Metadata = {
  title: "Plan Your Trip",
  description:
    "Plan your dream trip in three quick steps and get matched with verified travel agencies. Free for travelers.",
};

export default function PlanPage() {
  return (
    <main className="relative min-h-screen bg-gradient-mesh">
      <div className="absolute inset-0 -z-10 bg-background/80" />
      <header className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Plane className="h-5 w-5" />
          </span>
          <span className="text-xl font-display font-bold">
            Trip<span className="text-gradient">Slab</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Back home
        </Link>
      </header>

      <section className="container pb-24 pt-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Plan your <span className="text-gradient">dream trip</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Three quick steps. We&apos;ll match you with verified agencies who
            compete for your trip — completely free.
          </p>
        </div>
        <TripPlanner />
      </section>
    </main>
  );
}
