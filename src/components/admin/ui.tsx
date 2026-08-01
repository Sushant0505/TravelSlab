"use client";

import { cn } from "@/lib/utils";

/** Status pill with a tone derived from the status string. */
const TONES: Record<string, string> = {
  // lead
  NEW: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  VERIFIED: "bg-teal-500/15 text-teal-300 ring-teal-500/30",
  AVAILABLE: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  SOLD: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  HIDDEN: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  FRAUD: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  // agency
  APPROVED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  PENDING: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  SUSPENDED: "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  BLOCKED: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  // user
  ACTIVE: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  // destination / package
  PUBLISHED: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  DRAFT: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  REJECTED: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  PAUSED: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1",
        TONES[status] ?? "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.toLowerCase()}
    </span>
  );
}

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ActionButton({
  tone = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "default" | "danger" | "success" | "warning";
}) {
  const tones = {
    default: "border-zinc-700 text-zinc-300 hover:bg-zinc-800",
    danger: "border-rose-500/30 text-rose-300 hover:bg-rose-500/10",
    success: "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10",
    warning: "border-amber-500/30 text-amber-300 hover:bg-amber-500/10",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
        tones[tone],
        className,
      )}
    />
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
