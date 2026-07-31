"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const r = await fetch("/api/auth/agency/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Something went wrong");
      setResetUrl(d.resetUrl ?? null);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl md:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
          <MailCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Check your email</h2>
        <p className="mt-1 text-sm text-slate-500">
          If an account exists for <b>{email}</b>, we&apos;ve sent a password
          reset link. It expires in 1 hour.
        </p>

        {resetUrl && (
          <div className="mt-4 rounded-xl bg-amber-50 p-3 text-left text-xs text-amber-800">
            <p className="font-semibold">Demo mode — no email service connected.</p>
            <Link
              href={resetUrl.replace(/^https?:\/\/[^/]+/, "")}
              className="mt-1 block break-all font-medium text-indigo-600 underline"
            >
              Open your reset link
            </Link>
          </div>
        )}

        <Link
          href="/agencies/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Email address
          </span>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100">
            <Mail className="h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
              className="w-full bg-transparent text-sm text-slate-800 outline-none"
            />
          </div>
        </label>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </button>

        <Link
          href="/agencies/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </form>
  );
}
