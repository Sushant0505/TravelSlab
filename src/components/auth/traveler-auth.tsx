"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plane,
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const PERKS = [
  "Get matched with verified travel agencies",
  "Compare quotes for your dates & budget",
  "Track every trip request in one dashboard",
];

export function TravelerAuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const url = isSignup
        ? "/api/auth/traveler/register"
        : "/api/auth/traveler/login";
      const body = isSignup
        ? form
        : { email: form.email, password: form.password };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error ?? "Something went wrong");
      await qc.invalidateQueries({ queryKey: ["auth-session"] });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary lg:block">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur">
              <Plane className="h-5 w-5" />
            </span>
            <span className="font-display text-xl font-bold">TripSlab</span>
          </Link>

          <div>
            <h1 className="font-display text-4xl font-black leading-tight">
              {isSignup ? (
                <>Your next trip,<br />planned by experts.</>
              ) : (
                <>Welcome back,<br />let&apos;s keep exploring.</>
              )}
            </h1>
            <ul className="mt-8 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-3 text-white/90">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" />
            Free for travelers — your details stay private until you choose.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <Plane className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">
              Trip<span className="text-gradient">Slab</span>
            </span>
          </Link>

          <h2 className="font-display text-2xl font-bold text-foreground">
            {isSignup ? "Create your account" : "Sign in to TripSlab"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Join thousands of travelers planning smarter."
              : "Access your trips, quotes and activity."}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isSignup && (
              <AuthField
                icon={<User className="h-4 w-4" />}
                label="Full name"
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Ananya Sharma"
                autoComplete="name"
              />
            )}
            <AuthField
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {isSignup && (
              <AuthField
                icon={<Phone className="h-4 w-4" />}
                label="Mobile"
                value={form.mobile}
                onChange={(v) => set("mobile", v.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                autoComplete="tel"
              />
            )}
            <AuthField
              icon={<Lock className="h-4 w-4" />}
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => set("password", v)}
              placeholder={isSignup ? "At least 6 characters" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

            {error && (
              <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[position:right_center] disabled:opacity-70"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New to TripSlab? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-semibold text-primary hover:underline"
            >
              {isSignup ? "Sign in" : "Create one"}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function AuthField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</span>
      <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3.5 transition-shadow focus-within:ring-2 focus-within:ring-ring">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </label>
  );
}
