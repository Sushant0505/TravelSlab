"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Smartphone } from "lucide-react";

/**
 * Mobile OTP verification modal. On open it requests a code; in mock mode the
 * code comes back in the response and is shown in the amber banner.
 */
export function OtpDialog({
  mobile,
  open,
  onClose,
  onVerified,
}: {
  mobile: string;
  open: boolean;
  onClose: () => void;
  onVerified: (code: string) => void;
}) {
  const [mockOtp, setMockOtp] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  async function send() {
    setSending(true);
    setError("");
    setMockOtp("");
    setCode("");
    try {
      const r = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Could not send the code");
      if (d.otp) setMockOtp(d.otp); // mock mode → show it on screen
      setResendIn(30);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code");
    } finally {
      setSending(false);
    }
  }

  // Request a fresh code whenever the dialog opens for a number.
  useEffect(() => {
    if (open) send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mobile]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function verify() {
    if (code.length !== 6 || verifying) return;
    setVerifying(true);
    setError("");
    try {
      const r = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp: code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d?.error ?? "Incorrect code");
      onVerified(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Incorrect code");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-accent px-5 py-4 text-white">
              <div className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4" />
                Verify your mobile
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Progress accent — fills as the code is typed */}
            <div className="h-1 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                style={{ width: `${(code.length / 6) * 100}%` }}
              />
            </div>

            <div className="p-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Enter the 6-digit code sent to{" "}
                <b className="text-foreground">+91 {mobile || "—"}</b>
              </p>

              <AnimatePresence>
                {mockOtp && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl bg-amber-100/80 px-4 py-3 text-center text-sm font-semibold text-amber-800"
                  >
                    MOCK OTP:{" "}
                    <span className="text-lg font-bold tracking-widest">{mockOtp}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Verification Code
              </label>
              <input
                inputMode="numeric"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                placeholder="000000"
                className="w-full rounded-2xl border-2 border-input bg-background px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary"
              />

              {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

              <button
                onClick={verify}
                disabled={code.length !== 6 || verifying || sending}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify OTP"}
              </button>

              <div className="mt-3 text-center text-xs text-muted-foreground">
                {sending ? (
                  "Sending code…"
                ) : resendIn > 0 ? (
                  `Resend code in ${resendIn}s`
                ) : (
                  <button
                    onClick={send}
                    className="font-semibold text-primary hover:underline"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
