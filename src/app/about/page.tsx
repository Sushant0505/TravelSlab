import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Wallet,
  Layers,
  Users2,
  Sparkles,
  Plane,
  Building2,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SectionHead } from "@/components/home/section-head";
import { HowItWorks } from "@/components/home/how-it-works";

export const metadata: Metadata = {
  title: "About",
  description:
    "TripSlab is India's travel lead marketplace — travelers plan a trip in a minute and get matched with verified agencies who compete to craft the perfect itinerary. Free for travelers, private by design.",
  alternates: { canonical: "/about" },
};

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Verified agencies only",
    body: "Every agency is manually KYC-checked before it can buy a single lead, so you only ever hear from real, accountable businesses.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "Your name and number stay hidden. Agencies see only your trip and budget until you decide who to talk to.",
  },
  {
    icon: Wallet,
    title: "Free for travelers",
    body: "Planning and getting matched costs you nothing. Agencies pay a small fee to unlock a lead — never you.",
  },
  {
    icon: Layers,
    title: "Budget-slab matching",
    body: "We bracket every trip into a budget slab so agencies that fit your spend reach out — no mismatched sales calls.",
  },
];

const VALUES = [
  {
    icon: Users2,
    title: "Travelers first",
    body: "A traveler should never be spammed or oversold. We keep you anonymous and in control from the first tap.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability",
    body: "Agencies earn their place. Reviews, verification and admin oversight keep the marketplace clean.",
  },
  {
    icon: Sparkles,
    title: "Effortless planning",
    body: "Tell us where, when, how many and your budget — under a minute — and let the right agencies come to you.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent" />
          <div className="container py-20 text-center md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Plane className="h-3.5 w-3.5" /> About TripSlab
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              The trusted bridge between{" "}
              <span className="text-gradient">travelers</span> and{" "}
              <span className="text-gradient">verified agencies</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              TripSlab is India&apos;s travel lead marketplace. You plan your trip
              in a minute; verified agencies compete to craft the perfect
              itinerary for your dates and budget — while your contact details
              stay private until you choose.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/plan"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
              >
                <Sparkles className="h-4 w-4" /> Plan a trip
              </Link>
              <Link
                href="/agencies/register"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Building2 className="h-4 w-4" /> Register your agency
              </Link>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 md:py-20">
          <div className="container grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                Our mission
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                Make trip planning fair, private and effortless
              </h2>
              <div className="mt-5 space-y-4 text-muted-foreground">
                <p>
                  Planning a trip used to mean handing your number to a dozen
                  agencies and bracing for the calls. We flipped it around. On
                  TripSlab you share your trip once, stay anonymous, and let
                  verified agencies come to you with real quotes.
                </p>
                <p>
                  For agencies, it means warm, budget-tagged, OTP-verified leads
                  instead of cold guesswork. For travelers, it means choice
                  without the spam. Everyone wins when trust sits in the middle.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8">
              <div className="grid grid-cols-2 gap-6">
                <Stat label="Cost for travelers" value="₹0" hint="Always free" />
                <Stat label="Agency vetting" value="KYC" hint="Manually verified" />
                <Stat label="Contact privacy" value="Hidden" hint="Until you choose" />
                <Stat label="Budget slabs" value="6" hint="Matched to spend" />
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="bg-muted/30 py-20">
          <div className="container">
            <SectionHead
              eyebrow="Why TripSlab"
              title="Built on trust, not cold calls"
              subtitle="Four principles shape every part of the marketplace."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-3xl border border-border/60 bg-card p-6"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works (shared with home) */}
        <HowItWorks />

        {/* Values */}
        <section className="py-20">
          <div className="container">
            <SectionHead
              eyebrow="What we stand for"
              title="Our values"
              subtitle="The promises we hold ourselves to — for travelers and agencies alike."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-3xl border border-border/60 bg-card p-8 text-center"
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                    <v.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-accent to-secondary px-8 py-14 text-center text-white">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <h2 className="relative font-display text-3xl font-black sm:text-4xl">
                Ready to plan your next trip?
              </h2>
              <p className="relative mx-auto mt-3 max-w-xl text-white/90">
                Tell us where you want to go — verified agencies will do the rest.
                Free, fast and private.
              </p>
              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-105"
                >
                  Plan my trip <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/agencies"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Explore the marketplace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <div className="font-display text-3xl font-black text-gradient">{value}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
