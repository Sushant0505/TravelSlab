"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  AtSign,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  KeyRound,
} from "lucide-react";

const PERKS = [
  "Get matched with verified travel agencies",
  "Compare quotes for your dates & budget",
  "Track every trip request in one dashboard",
];

/** Passwordless traveler login: identifier → OTP → session. */
export function TravelerAuthForm() {
  const router = useRouter();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<"identify" | "otp">("identify");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [mockOtp, setMockOtp] = useState("");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [noAccount, setNoAccount] = useState(false);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (identifier.trim().length < 3) return;
    setBusy(true);
    setError("");
    setNoAccount(false);
    try {
      const r = await fetch("/api/auth/traveler/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 404) {
        setNoAccount(true);
        throw new Error(d?.error ?? "No account found");
      }
      if (!r.ok) throw new Error(d?.error ?? "Could not send the code");
      setMaskedMobile(d.mobile ?? "");
      if (d.otp) setMockOtp(d.otp);
      setPhase("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (otp.length !== 6) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/traveler/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), otp }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Incorrect code");
      await qc.invalidateQueries({ queryKey: ["auth-session"] });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect code");
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
              Welcome back,
              <br />
              let&apos;s keep exploring.
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
            Passwordless & secure — sign in with a one-time code.
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

          <AnimatePresence mode="wait">
            {phase === "identify" ? (
              <motion.div
                key="identify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Sign in to TripSlab
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email or mobile — we&apos;ll send a one-time code.
                </p>

                <form onSubmit={sendOtp} className="mt-7 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-foreground/80">
                      Email or mobile
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3.5 transition-shadow focus-within:ring-2 focus-within:ring-ring">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      <input
                        autoFocus
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="you@example.com or 9876543210"
                        className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </label>

                  {error && (
                    <div className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600">
                      {error}
                      {noAccount && (
                        <>
                          {" "}
                          <Link href="/plan" className="font-semibold underline">
                            Plan a trip
                          </Link>{" "}
                          to create one.
                        </>
                      )}
                    </div>
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
                        Send code
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  New to TripSlab?{" "}
                  <Link href="/plan" className="font-semibold text-primary hover:underline">
                    Plan a trip
                  </Link>{" "}
                  — your account is created automatically.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <button
                  onClick={() => {
                    setPhase("identify");
                    setOtp("");
                    setError("");
                  }}
                  className="mb-4 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <h2 className="font-display text-2xl font-bold text-foreground">
                  Enter your code
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sent to <b className="text-foreground">{maskedMobile || "your mobile"}</b>
                </p>

                {mockOtp && (
                  <div className="mt-4 rounded-xl bg-amber-100/80 px-4 py-3 text-center text-sm font-semibold text-amber-800">
                    MOCK OTP:{" "}
                    <span className="text-lg font-bold tracking-widest">{mockOtp}</span>
                  </div>
                )}

                <form onSubmit={verify} className="mt-5 space-y-4">
                  <div className="flex items-center gap-2 rounded-2xl border-2 border-input bg-background px-3.5 focus-within:border-primary">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <input
                      autoFocus
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                      }}
                      placeholder="000000"
                      className="w-full bg-transparent py-3.5 text-center text-2xl font-bold tracking-[0.5em] outline-none placeholder:text-muted-foreground/40"
                    />
                  </div>

                  {error && (
                    <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy || otp.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary bg-[length:200%_auto] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-[position:right_center] disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                  </button>
                </form>

                <button
                  onClick={() => sendOtp()}
                  disabled={busy}
                  className="mt-4 w-full text-center text-sm font-medium text-primary hover:underline disabled:opacity-60"
                >
                  Resend code
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
