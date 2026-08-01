"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  X as XIcon,
  EyeOff,
  Star,
  Loader2,
  Clock,
  MapPin,
  CalendarDays,
  Package as PackageIcon,
  Building2,
  ExternalLink,
} from "lucide-react";
import { AdminCard, PageHeading, StatusBadge, ActionButton } from "./ui";
import { formatINR } from "@/lib/utils";
import type { AdminPackage, PackageStatus } from "@/server/package-repo";

const TABS = ["PENDING", "APPROVED", "PAUSED", "HIDDEN", "REJECTED", "ALL"] as const;
type Tab = (typeof TABS)[number];

type Counts = Record<PackageStatus, number>;

export function PackagesManager() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("PENDING");
  const [preview, setPreview] = useState<AdminPackage | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-packages", tab],
    queryFn: async (): Promise<{ packages: AdminPackage[]; counts: Counts }> => {
      const qs = tab === "ALL" ? "" : `?status=${tab}`;
      return (await fetch(`/api/admin/packages${qs}`)).json();
    },
    refetchInterval: 20000,
  });

  const act = useMutation({
    mutationFn: async (body: { id: string; action: string }) => {
      const r = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const packages = data?.packages ?? [];
  const counts = data?.counts;

  const tabCount = (t: Tab): number | undefined => {
    if (!counts) return undefined;
    if (t === "ALL")
      return Object.values(counts).reduce((s, n) => s + n, 0);
    return counts[t];
  };

  return (
    <div>
      <PageHeading
        title="Package Moderation"
        subtitle="Approve, reject, hide or feature agency-submitted trip packages"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {t}
            {tabCount(t) != null && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === t ? "bg-violet-500/30 text-violet-100" : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {tabCount(t)}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <AdminCard className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-800 text-zinc-400">
            <PackageIcon className="h-6 w-6" />
          </span>
          <p className="font-semibold text-white">No {tab === "ALL" ? "" : tab.toLowerCase()} packages</p>
          <p className="max-w-sm text-sm text-zinc-400">
            Agencies submit packages from their console. New submissions land in
            the <span className="text-zinc-200">Pending</span> queue for your review.
          </p>
        </AdminCard>
      ) : (
        <div className="grid gap-3">
          {packages.map((p) => (
            <AdminCard key={p.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => setPreview(p)}
                  className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-32"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.heroImage} alt="" className="h-full w-full object-cover" />
                  {p.featured && (
                    <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Star className="h-2.5 w-2.5 fill-current" /> Featured
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => setPreview(p)} className="text-left">
                      <h3 className="font-semibold text-white hover:text-violet-300">{p.name}</h3>
                    </button>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-500" /> {p.destinationName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" /> {p.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-zinc-500" /> {p.dates.length} date
                      {p.dates.length === 1 ? "" : "s"}
                    </span>
                    <span className="font-semibold text-zinc-200">{formatINR(p.price)}</span>
                    {p.slabLabel && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        {p.slabLabel}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <Building2 className="h-3 w-3" /> {p.agencyName}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch">
                  {p.status !== "APPROVED" && (
                    <ActionButton tone="success" onClick={() => act.mutate({ id: p.id, action: "approve" })}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </ActionButton>
                  )}
                  {p.status !== "REJECTED" && (
                    <ActionButton tone="danger" onClick={() => act.mutate({ id: p.id, action: "reject" })}>
                      <XIcon className="h-3.5 w-3.5" /> Reject
                    </ActionButton>
                  )}
                  {p.status !== "HIDDEN" && (
                    <ActionButton tone="warning" onClick={() => act.mutate({ id: p.id, action: "hide" })}>
                      <EyeOff className="h-3.5 w-3.5" /> Hide
                    </ActionButton>
                  )}
                  <ActionButton
                    tone={p.featured ? "warning" : "default"}
                    onClick={() => act.mutate({ id: p.id, action: p.featured ? "unfeature" : "feature" })}
                  >
                    <Star className={`h-3.5 w-3.5 ${p.featured ? "fill-current" : ""}`} />
                    {p.featured ? "Unfeature" : "Feature"}
                  </ActionButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AnimatePresence>
        {preview && <PackagePreview pkg={preview} onClose={() => setPreview(null)} />}
      </AnimatePresence>
    </div>
  );
}

function PackagePreview({ pkg, onClose }: { pkg: AdminPackage; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-5 py-4 backdrop-blur">
          <h3 className="font-semibold text-white">{pkg.name}</h3>
          <div className="flex items-center gap-2">
            {pkg.status === "APPROVED" && (
              <a
                href={`/trips/${pkg.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View live
              </a>
            )}
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5 text-sm text-zinc-300">
          {pkg.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {pkg.images.slice(0, 6).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Meta label="Destination" value={pkg.destinationName} />
            <Meta label="Price" value={formatINR(pkg.price)} />
            <Meta label="Duration" value={pkg.duration} />
            <Meta label="Slab" value={pkg.slabLabel || "—"} />
            <Meta label="Max travellers" value={String(pkg.maxTravelers || "—")} />
            <Meta label="Agency" value={pkg.agencyName} />
          </div>

          <p className="leading-relaxed text-zinc-300">{pkg.description}</p>

          {pkg.highlights.length > 0 && (
            <Section title="Highlights">
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {pkg.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {h}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {pkg.inclusions.length > 0 && (
              <Section title="Inclusions">
                <ul className="space-y-1">
                  {pkg.inclusions.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {h}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {pkg.exclusions.length > 0 && (
              <Section title="Exclusions">
                <ul className="space-y-1">
                  {pkg.exclusions.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" /> {h}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {pkg.itinerary.length > 0 && (
            <Section title="Itinerary">
              <ol className="space-y-2">
                {pkg.itinerary.map((d, i) => (
                  <li key={i} className="rounded-lg border border-zinc-800 p-2.5">
                    <div className="text-xs font-semibold text-violet-300">
                      Day {d.day}: {d.title}
                    </div>
                    <div className="text-xs text-zinc-400">{d.detail}</div>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {pkg.dates.length > 0 && (
            <Section title="Departure dates">
              <div className="flex flex-wrap gap-1.5">
                {pkg.dates.map((d, i) => (
                  <span key={i} className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-200">
                    {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="text-zinc-500">{label}: </span>
      <span className="font-medium text-zinc-200">{value}</span>
    </span>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h4>
      {children}
    </div>
  );
}
