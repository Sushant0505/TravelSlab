"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Plane,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  PartyPopper,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "./field";
import { CityAutocomplete } from "./city-autocomplete";
import { OtpDialog } from "./otp-dialog";
import { usePlanner, perTravelerBudget } from "@/store/planner";
import { DESTINATIONS, TRIP_TYPES } from "@/lib/destinations";
import { formatINR } from "@/lib/utils";

const STEPS = ["Your details", "Trip details", "Confirm"];

export function TripPlanner() {
  const s = usePlanner();
  const router = useRouter();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "done">("idle");
  const [leadRef, setLeadRef] = useState<string>("");
  const [otpOpen, setOtpOpen] = useState(false);

  const perHead = perTravelerBudget(s);

  function validateStep0() {
    const e: Record<string, string> = {};
    if (s.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(s.email)) e.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(s.mobile))
      e.mobile = "Enter a valid 10-digit mobile";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!s.destination) e.destination = "Choose a destination";
    if (s.departureCity.trim().length < 2) e.departureCity = "Enter a city";
    if (!s.travelDate) e.travelDate = "Pick a date";
    if (!s.tripType) e.tripType = "Choose a trip type";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (s.step === 0 && !validateStep0()) return;
    if (s.step === 1 && !validateStep1()) return;
    s.next();
  }

  /**
   * Called from the OTP dialog with the entered code. The server verifies the
   * OTP, auto-creates/links the traveler account, creates the lead and logs the
   * traveler in — all in one call. On success we route to the dashboard.
   */
  async function finalizeLead(code: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          email: s.email,
          mobile: s.mobile,
          destination: s.destination,
          departureCity: s.departureCity,
          travelers: s.travelers,
          budget: s.budget,
          travelDate: s.travelDate,
          tripType: s.tripType,
          preferences: s.preferences,
          otp: code,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error ?? "Could not submit your trip." };
      }
      setLeadRef(data.reference ?? "");
      await qc.invalidateQueries({ queryKey: ["auth-session"] });
      setOtpOpen(false);
      setStatus("done");
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }

  if (status === "done") {
    return <SuccessCard reference={leadRef} />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Stepper current={s.step} />

      <div className="mt-8 rounded-3xl border border-border/60 bg-card p-6 shadow-xl md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {s.step === 0 && (
              <div className="space-y-5">
                <Header
                  icon={<User className="h-5 w-5" />}
                  title="Tell us about you"
                  sub="We keep this private. Agencies only see it after they buy your lead."
                />
                <TextField
                  label="Full name"
                  value={s.name}
                  error={errors.name}
                  onChange={(e) => s.set({ name: e.target.value })}
                  placeholder="Ananya Sharma"
                />
                <TextField
                  label="Email"
                  type="email"
                  value={s.email}
                  error={errors.email}
                  onChange={(e) => s.set({ email: e.target.value })}
                  placeholder="you@example.com"
                />
                <TextField
                  label="Mobile"
                  type="tel"
                  value={s.mobile}
                  error={errors.mobile}
                  onChange={(e) => s.set({ mobile: e.target.value })}
                  placeholder="9876543210"
                />
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  No password needed — we&apos;ll verify your mobile with an OTP
                  and set up your account automatically.
                </p>
              </div>
            )}

            {s.step === 1 && (
              <div className="space-y-5">
                <Header
                  icon={<Plane className="h-5 w-5" />}
                  title="Where to?"
                  sub="The more detail you add, the better your matches."
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <SelectField
                    label="Destination"
                    value={s.destination}
                    onChange={(e) => s.set({ destination: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {DESTINATIONS.map((d) => (
                      <option key={d.slug} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </SelectField>
                  <CityAutocomplete
                    label="Departure city"
                    value={s.departureCity}
                    error={errors.departureCity}
                    onChange={(v) => s.set({ departureCity: v })}
                    placeholder="Mumbai"
                  />
                  <TextField
                    label="Travelers"
                    type="number"
                    min={1}
                    max={40}
                    value={s.travelers}
                    onChange={(e) =>
                      s.set({ travelers: Number(e.target.value) || 1 })
                    }
                  />
                  <TextField
                    label="Total budget (₹)"
                    type="number"
                    min={0}
                    step={1000}
                    value={s.budget}
                    onChange={(e) =>
                      s.set({ budget: Number(e.target.value) || 0 })
                    }
                  />
                  <TextField
                    label="Travel date"
                    type="date"
                    value={s.travelDate}
                    error={errors.travelDate}
                    onChange={(e) => s.set({ travelDate: e.target.value })}
                  />
                  <SelectField
                    label="Trip type"
                    value={s.tripType}
                    onChange={(e) =>
                      s.set({ tripType: e.target.value as never })
                    }
                  >
                    <option value="">Select…</option>
                    {TRIP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-foreground/80">
                    Preferences (optional)
                  </span>
                  <textarea
                    rows={3}
                    value={s.preferences}
                    onChange={(e) => s.set({ preferences: e.target.value })}
                    placeholder="Sea-facing stay, vegetarian food, moderate trekking…"
                    className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
                  />
                </label>
                <BudgetNote perHead={perHead} />
              </div>
            )}

            {s.step === 2 && (
              <div className="space-y-5">
                <Header
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Review & confirm"
                  sub="Double-check your request before we match you."
                />
                <dl className="divide-y divide-border/60 rounded-2xl border border-border/60">
                  <Row label="Name" value={s.name} />
                  <Row label="Contact" value={`${s.email} · ${s.mobile}`} />
                  <Row
                    label="Trip"
                    value={`${s.destination} from ${s.departureCity}`}
                  />
                  <Row
                    label="Group & date"
                    value={`${s.travelers} traveler(s) · ${s.travelDate}`}
                  />
                  <Row label="Type" value={s.tripType || "—"} />
                  <Row
                    label="Budget"
                    value={`${formatINR(s.budget)} (${formatINR(perHead)}/head)`}
                  />
                </dl>
                <p className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  We&apos;ll text a verification code to{" "}
                  <b className="text-foreground">+91 {s.mobile}</b> to confirm
                  and finalize your trip.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={s.back}
            disabled={s.step === 0}
            className={s.step === 0 ? "invisible" : ""}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {s.step < 2 ? (
            <Button variant="gradient" onClick={handleNext}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="gradient" onClick={() => setOtpOpen(true)}>
              <PartyPopper className="h-4 w-4" />
              Verify &amp; submit
            </Button>
          )}
        </div>
      </div>

      <OtpDialog
        mobile={s.mobile}
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        onSubmit={finalizeLead}
      />
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              i <= current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full text-xs ${
                i < current
                  ? "bg-white/25"
                  : i === current
                    ? "bg-white/25"
                    : "bg-background/60"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-6 ${i < current ? "bg-primary" : "bg-border"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function Header({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
        {icon}
      </span>
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right font-medium ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function BudgetNote({ perHead }: { perHead: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3">
      <span className="text-sm text-muted-foreground">
        Approx. per traveler:{" "}
        <b className="text-foreground">{formatINR(perHead)}</b>
      </span>
      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
        Great matches available
      </span>
    </div>
  );
}

function SuccessCard({ reference }: { reference: string }) {
  const reset = usePlanner((st) => st.reset);
  const router = useRouter();

  // The traveler is now signed in — take them to their dashboard.
  useEffect(() => {
    const t = setTimeout(() => router.push("/dashboard"), 1600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto w-full max-w-lg rounded-3xl border border-border/60 bg-card p-10 text-center shadow-xl"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg"
      >
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>
      <h2 className="mt-6 font-display text-2xl font-bold">
        Your trip is live! 🎉
      </h2>
      <p className="mt-2 text-muted-foreground">
        Your trip request is live. Verified agencies can now reach out with
        tailored itineraries and quotes for your dates and budget.
      </p>
      {reference && (
        <p className="mt-4 inline-block rounded-full bg-muted px-4 py-1.5 text-sm font-mono">
          Ref: {reference}
        </p>
      )}
      <p className="mt-6 text-sm text-muted-foreground">
        Taking you to your dashboard… Your name and number stay hidden until an
        agency buys your lead.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="gradient" onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            reset();
            router.push("/plan");
          }}
        >
          Plan another trip
        </Button>
      </div>
    </motion.div>
  );
}
