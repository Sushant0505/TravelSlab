"use client";

import { motion } from "framer-motion";
import { PencilLine, ShieldCheck, Users2, Sparkles } from "lucide-react";
import { SectionHead } from "./section-head";

const STEPS = [
  {
    icon: PencilLine,
    title: "Plan your trip",
    body: "Share where, when, how many and your budget. Takes under a minute.",
  },
  {
    icon: ShieldCheck,
    title: "We verify you",
    body: "A quick OTP keeps the marketplace clean and your lead high-quality.",
  },
  {
    icon: Users2,
    title: "Agencies compete",
    body: "Verified agencies unlock your request and reach out with tailored quotes.",
  },
  {
    icon: Sparkles,
    title: "You pick the best",
    body: "Compare itineraries and prices. Your contact stays private until you choose.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24">
      <div className="container">
        <SectionHead
          eyebrow="How it works"
          title="From idea to itinerary"
          subtitle="TripSlab sits in the middle: travelers stay anonymous, agencies stay accountable."
        />
        <div className="relative grid gap-6 md:grid-cols-4">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative rounded-3xl border border-border/60 bg-card p-6 text-center"
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                <s.icon className="h-7 w-7" />
              </div>
              <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Step {i + 1}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
