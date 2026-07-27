"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PERKS = [
  "Pay only for the leads you unlock",
  "Filter by budget, destination & lead score",
  "Verified, OTP-checked traveler contacts",
  "Instant invoices via Razorpay & Stripe",
];

export function AgencyCTA() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-10 md:p-16"
        >
          <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
          <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white ring-1 ring-white/20">
                <Building2 className="h-3.5 w-3.5" /> For agencies
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
                Stop chasing cold leads.
                <br />
                <span className="text-gradient">Buy warm ones.</span>
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                Browse a live marketplace of qualified, budget-tagged travel
                requests. Unlock only what fits your business — traveler details
                revealed the moment you buy.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="gradient" size="lg">
                  <Link href="/agencies/register">Register your agency</Link>
                </Button>
                <Button asChild variant="glass" size="lg">
                  <Link href="/agencies">Browse leads</Link>
                </Button>
              </div>
            </div>

            <ul className="space-y-4">
              {PERKS.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 text-white ring-1 ring-white/10"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium">{p}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
