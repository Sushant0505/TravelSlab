"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setStatus("sending");
    try {
      const r = await fetch("/api/auth/agency/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error ?? "Could not reset password");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl md:p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Password updated</h2>
        <p className="mt-1 text-sm text-slate-500">
          You can now sign in with your new password.
        </p>
        <Link
          href="/agencies/login"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  if (token === null) {
    // Still reading the query on mount; show nothing jarring.
    return (
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl md:p-8">
        <h2 className="text-lg font-bold text-slate-900">Invalid reset link</h2>
        <p className="mt-1 text-sm text-slate-500">
          This link is missing its token. Please request a new one.
        </p>
        <Link
          href="/agencies/forgot-password"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Request a new link
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
        <PasswordField
          label="New password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
        />
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          placeholder="Re-enter password"
        />

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
              <Loader2 className="h-4 w-4 animate-spin" /> Updating…
            </>
          ) : (
            "Update password"
          )}
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-indigo-100">
        <Lock className="h-4 w-4 text-slate-400" />
        <input
          type="password"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-800 outline-none"
        />
      </div>
    </label>
  );
}
