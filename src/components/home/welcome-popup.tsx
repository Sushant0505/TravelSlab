"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  PlaneTakeoff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgePercent,
  MapPin,
  Star,
} from "lucide-react";
import { usePlanner } from "@/store/planner";
import { useWelcome } from "@/store/welcome";
import { DESTINATIONS, TRIP_TYPES } from "@/lib/destinations";
import { formatINR } from "@/lib/utils";

const SESSION_KEY = "tripslab-welcome-seen";

/** Rotating hero slides for the creative left panel. */
const SLIDES = [
  {
    name: "Bali",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1400&q=80",
    from: 54999,
    tag: "Rice terraces & temples",
  },
  {
    name: "Kashmir",
    image:
      "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=1400&q=80",
    from: 9999,
    tag: "Dal Lake & snow valleys",
  },
  {
    name: "Dubai",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1400&q=80",
    from: 62999,
    tag: "Skylines & desert safaris",
  },
  {
    name: "Thailand",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1400&q=80",
    from: 38999,
    tag: "Islands, food & nightlife",
  },
];

/**
 * Full welcome popup — big creative image panel on the left, a quick
 * lead-capture form on the right. Fires once per browser session, seeds the
 * planner store and drops the visitor straight into /plan pre-filled.
 */
export function WelcomePopup() {
  const router = useRouter();
  const pathname = usePathname();
  const setPlanner = usePlanner((s) => s.set);
  const open = useWelcome((s) => s.open);
  const setOpen = useWelcome((s) => s.setOpen);

  const [slide, setSlide] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [tripType, setTripType] = useState("");
  const [destination, setDestination] = useState("");
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const grouped = useMemo(
    () => ({
      India: DESTINATIONS.filter((d) => d.scope === "India"),
      World: DESTINATIONS.filter((d) => d.scope === "World"),
    }),
    [],
  );

  // Auto-open once per session, shortly after landing — home page only.
  // (The floating button can still re-open it anywhere via the store.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname !== "/") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 2600);
    return () => clearTimeout(t);
  }, [pathname, setOpen]);

  // Auto-advance the left-panel slideshow while open.
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 3600);
    return () => clearInterval(t);
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function validate() {
    const e: Record<string, string> = {};
    if (firstName.trim().length < 2) e.firstName = "Enter your first name";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(mobile)) e.mobile = "Enter a valid 10-digit mobile";
    if (!tripType) e.tripType = "Pick a trip style";
    if (!destination) e.destination = "Choose a destination";
    if (!consent) e.consent = "Please accept to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Seed the planner and jump into the trip-details step pre-filled.
    setPlanner({
      name: `${firstName} ${lastName}`.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      destination,
      tripType: tripType as never,
      step: 1,
    });
    setOpen(false);
    router.push("/plan");
  }

  const active = SLIDES[slide];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[92vh] w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl bg-card shadow-2xl md:grid-cols-2"
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/45 md:bg-white/80 md:text-slate-700 md:hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ---------- Left: creative image panel ---------- */}
            <div className="relative h-40 overflow-hidden md:h-auto">
              {/* Rotating photos */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={active.image}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${active.image})` }}
                />
              </AnimatePresence>

              {/* Brand gradient wash */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/85 via-primary/40 to-accent/60 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />

              {/* Animated flight path + plane */}
              <svg
                className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
                viewBox="0 0 400 500"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M20 460 C 120 380, 90 220, 220 170 S 360 90, 380 40"
                  stroke="white"
                  strokeOpacity="0.5"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                />
              </svg>
              <motion.div
                className="pointer-events-none absolute hidden text-white/90 md:block"
                initial={{ left: "6%", top: "88%", rotate: -32 }}
                animate={{ left: "82%", top: "10%", rotate: -32 }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <PlaneTakeoff className="h-7 w-7 drop-shadow-lg" />
              </motion.div>

              {/* Offer badge */}
              <div className="absolute left-5 top-5 z-10 hidden md:block">
                <motion.div
                  animate={{ rotate: [-3, 3, -3] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground shadow-lg"
                >
                  <BadgePercent className="h-3.5 w-3.5" />
                  FLAT {formatINR(5000)} OFF
                </motion.div>
              </div>

              {/* Copy */}
              <div className="relative z-10 flex h-full flex-col justify-end p-5 md:p-7">
                <p className="hidden font-display text-3xl font-black leading-[1.05] text-white drop-shadow md:block lg:text-4xl">
                  Your next
                  <br />
                  <span className="text-secondary">bucket-list</span> trip
                  <br />
                  starts here.
                </p>

                {/* Current slide caption */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-semibold">{active.name}</span>
                    <span className="hidden text-xs text-white/70 sm:inline">
                      · {active.tag}
                    </span>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                    from {formatINR(active.from)}
                  </span>
                </div>

                {/* Slide dots */}
                <div className="mt-3 flex gap-1.5">
                  {SLIDES.map((s, i) => (
                    <button
                      key={s.name}
                      onClick={() => setSlide(i)}
                      aria-label={`Show ${s.name}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>

                {/* Trust row */}
                <div className="mt-4 hidden items-center gap-4 text-[11px] font-medium text-white/85 md:flex">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    4.8/5 travelers
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                    Verified agencies
                  </span>
                </div>
              </div>
            </div>

            {/* ---------- Right: form panel ---------- */}
            <form
              onSubmit={onSubmit}
              className="flex max-h-[92vh] flex-col overflow-y-auto p-5 sm:p-7"
            >
              <div className="mb-1 flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Free trip planning
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Plan Your Next Trip
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us the basics — we&apos;ll match you with verified agencies
                in minutes.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <PopupField
                  label="First name"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Ananya"
                  error={errors.firstName}
                />
                <PopupField
                  label="Last name"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Sharma"
                />
              </div>

              <div className="mt-3">
                <PopupField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={errors.email}
                />
              </div>

              <div className="mt-3">
                <FieldLabel>Mobile</FieldLabel>
                <div
                  className={`flex items-center overflow-hidden rounded-xl border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring ${
                    errors.mobile ? "border-red-400" : "border-input"
                  }`}
                >
                  <span className="flex items-center gap-1 border-r border-input bg-muted px-3 py-3 text-sm font-medium text-foreground/80">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder="98765 43210"
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {errors.mobile && <FieldError>{errors.mobile}</FieldError>}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Trip style</FieldLabel>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                    className={`w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring ${
                      errors.tripType ? "border-red-400" : "border-input"
                    } ${tripType ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    <option value="">Select a style</option>
                    {TRIP_TYPES.map((t) => (
                      <option key={t} value={t} className="text-foreground">
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.tripType && <FieldError>{errors.tripType}</FieldError>}
                </div>

                <div>
                  <FieldLabel>Destination</FieldLabel>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className={`w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring ${
                      errors.destination ? "border-red-400" : "border-input"
                    } ${destination ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    <option value="">Where to?</option>
                    <optgroup label="India">
                      {grouped.India.map((d) => (
                        <option key={d.slug} value={d.name} className="text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="International">
                      {grouped.World.map((d) => (
                        <option key={d.slug} value={d.name} className="text-foreground">
                          {d.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {errors.destination && (
                    <FieldError>{errors.destination}</FieldError>
                  )}
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  Keep me updated with trip offers & inspiration via email, SMS
                  and WhatsApp. Your details stay private until you pick an
                  agency.
                </span>
              </label>
              {errors.consent && <FieldError>{errors.consent}</FieldError>}

              <button
                type="submit"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[position:right_center] active:scale-[0.98]"
              >
                Start Planning
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Maybe later
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-semibold text-foreground/80">
      {children}
    </span>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-red-500">{children}</p>;
}

function PopupField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring ${
          error ? "border-red-400" : "border-input"
        }`}
      />
      {error && <FieldError>{error}</FieldError>}
    </label>
  );
}
