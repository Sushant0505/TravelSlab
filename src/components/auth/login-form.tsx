"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, LogIn } from "lucide-react";

type Variant = "agency" | "admin";

const THEME: Record<
  Variant,
  {
    wrap: string;
    label: string;
    input: string;
    button: string;
    accent: string;
  }
> = {
  agency: {
    wrap: "border-slate-200 bg-white",
    label: "text-slate-700",
    input:
      "border-slate-200 bg-white text-slate-800 focus-within:ring-indigo-100",
    button: "bg-indigo-600 hover:bg-indigo-700",
    accent: "text-indigo-600",
  },
  admin: {
    wrap: "border-zinc-800 bg-zinc-900",
    label: "text-zinc-300",
    input:
      "border-zinc-700 bg-zinc-950 text-zinc-100 focus-within:ring-violet-500/20",
    button: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110",
    accent: "text-violet-400",
  },
};

export function LoginForm({
  variant,
  endpoint,
  defaultNext,
  demoEmail,
  demoPassword,
}: {
  variant: Variant;
  endpoint: string;
  defaultNext: string;
  demoEmail: string;
  demoPassword: string;
}) {
  const router = useRouter();
  const t = THEME[variant];
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");
  const [next, setNext] = useState(defaultNext);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n && n.startsWith(defaultNext)) setNext(n);
  }, [defaultNext]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Login failed");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setStatus("idle");
    }
  }

  const isDark = variant === "admin";

  return (
    <form
      onSubmit={submit}
      className={`w-full max-w-sm rounded-3xl border p-6 shadow-xl md:p-8 ${t.wrap}`}
    >
      <div className="space-y-4">
        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${t.label}`}>
            Email
          </span>
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 focus-within:ring-2 ${t.input}`}
          >
            <Mail className="h-4 w-4 opacity-50" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              autoComplete="email"
            />
          </div>
        </label>

        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${t.label}`}>
            Password
          </span>
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 focus-within:ring-2 ${t.input}`}
          >
            <Lock className="h-4 w-4 opacity-50" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              autoComplete="current-password"
            />
          </div>
        </label>

        {error && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              isDark ? "bg-rose-500/10 text-rose-300" : "bg-rose-50 text-rose-600"
            }`}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-70 ${t.button}`}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </button>

        <div
          className={`rounded-xl px-3 py-2.5 text-xs ${
            isDark ? "bg-zinc-800/60 text-zinc-400" : "bg-slate-50 text-slate-500"
          }`}
        >
          <span className="font-semibold">Demo login</span> — email &amp;
          password are pre-filled. Just click{" "}
          <span className={t.accent}>Sign in</span>.
        </div>
      </div>
    </form>
  );
}
