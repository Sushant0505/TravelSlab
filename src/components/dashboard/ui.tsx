import { cn } from "@/lib/utils";

export function DashCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <DashCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      </div>
      {action}
    </DashCard>
  );
}

const STATUS: Record<string, { label: string; className: string }> = {
  NEW: { label: "Pending verification", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  VERIFIED: { label: "Verified", className: "bg-teal-50 text-teal-700 ring-teal-200" },
  AVAILABLE: { label: "Live", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  SOLD: { label: "Live", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  HIDDEN: { label: "Paused", className: "bg-slate-100 text-slate-600 ring-slate-200" },
  FRAUD: { label: "Under review", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export function TripStatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.NEW;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        s.className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
