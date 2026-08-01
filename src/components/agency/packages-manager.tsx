"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Loader2,
  X,
  Save,
  MapPin,
  Clock,
  CalendarDays,
  Info,
  ExternalLink,
} from "lucide-react";
import { GalleryUploader } from "@/components/shared/image-uploader";
import { formatINR } from "@/lib/utils";
import type { AgencyPackage } from "@/server/package-repo";

interface TierView {
  id: string;
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
  leadPrice: number;
}
interface DestOpt { id: string; name: string; slug: string }
interface TripTypeOpt { id: string; name: string }
interface ItinDay { day: number; title: string; detail: string }

interface FormState {
  name: string;
  destinationId: string;
  duration: string;
  durationDays: number;
  price: number;
  slabId: string;
  slabLabel: string;
  typeId: string;
  typeLabel: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: ItinDay[];
  maxTravelers: number;
  popular: boolean;
  images: string[];
  dates: string[];
}

const EMPTY: FormState = {
  name: "",
  destinationId: "",
  duration: "",
  durationDays: 0,
  price: 0,
  slabId: "",
  slabLabel: "",
  typeId: "",
  typeLabel: "",
  description: "",
  inclusions: [],
  exclusions: [],
  highlights: [],
  itinerary: [],
  maxTravelers: 0,
  popular: false,
  images: [],
  dates: [],
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  HIDDEN: "bg-slate-200 text-slate-600",
  PAUSED: "bg-orange-100 text-orange-700",
};
const STATUS_HINT: Record<string, string> = {
  PENDING: "Awaiting admin review — not visible to travellers yet.",
  APPROVED: "Live on your destination page. Agency identity stays hidden.",
  REJECTED: "Rejected by admin. Edit and resubmit to try again.",
  HIDDEN: "Hidden by admin.",
  PAUSED: "Paused by you — hidden from travellers. Resume anytime.",
};

export function AgencyPackagesManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<AgencyPackage | "new" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agency-packages"],
    queryFn: async (): Promise<{ packages: AgencyPackage[] }> =>
      (await fetch("/api/agency/packages")).json(),
    refetchInterval: 20000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["agency-packages"] });

  const pause = useMutation({
    mutationFn: (b: { id: string; paused: boolean }) =>
      fetch("/api/agency/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b),
      }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/agency/packages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: invalidate,
  });

  const packages = data?.packages ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My packages</h1>
          <p className="text-sm text-slate-500">
            Create trip packages — approved ones appear on their destination page.
            Travellers never see your agency details.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> New package
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-slate-800">No packages yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Add your first trip package. Choose a destination and budget slab —
            once an admin approves it, it goes live automatically.
          </p>
          <button
            onClick={() => setEditing("new")}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Create a package
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {packages.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.heroImage} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLES[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.destinationName}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.duration}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {p.dates.length} dates</span>
                    <span className="font-semibold text-slate-700">{formatINR(p.price)}</span>
                    {p.slabLabel && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px]">{p.slabLabel}</span>}
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-[11px] text-slate-400">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" /> {STATUS_HINT[p.status]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:flex-col">
                  <button
                    onClick={() => setEditing(p)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  {(p.status === "APPROVED" || p.status === "PAUSED") && (
                    <button
                      onClick={() => pause.mutate({ id: p.id, paused: p.status === "APPROVED" })}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {p.status === "APPROVED" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {p.status === "APPROVED" ? "Pause" : "Resume"}
                    </button>
                  )}
                  {p.status === "APPROVED" && (
                    <a
                      href={`/trips/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <PackageEditor
            pkg={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              invalidate();
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PackageEditor({
  pkg,
  onClose,
  onSaved,
}: {
  pkg: AgencyPackage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: destData } = useQuery({
    queryKey: ["dest-options"],
    queryFn: async (): Promise<{ destinations: DestOpt[] }> =>
      (await fetch("/api/destinations")).json(),
  });
  const { data: tierData } = useQuery({
    queryKey: ["slab-tiers-public"],
    queryFn: async (): Promise<{ tiers: TierView[] }> =>
      (await fetch("/api/slab-tiers")).json(),
  });
  const { data: typeData } = useQuery({
    queryKey: ["trip-types-public"],
    queryFn: async (): Promise<{ types: TripTypeOpt[] }> =>
      (await fetch("/api/trip-types")).json(),
  });
  const destinations = destData?.destinations ?? [];
  const tiers = tierData?.tiers ?? [];
  const tripTypes = typeData?.types ?? [];

  const [form, setForm] = useState<FormState>(() =>
    pkg
      ? {
          name: pkg.name,
          destinationId: pkg.destinationId,
          duration: pkg.duration,
          durationDays: pkg.durationDays,
          price: pkg.price,
          slabId: "",
          slabLabel: pkg.slabLabel,
          typeId: pkg.typeId,
          typeLabel: pkg.typeLabel,
          description: pkg.description,
          inclusions: pkg.inclusions,
          exclusions: pkg.exclusions,
          highlights: pkg.highlights,
          itinerary: pkg.itinerary,
          maxTravelers: pkg.maxTravelers,
          popular: pkg.popular,
          images: pkg.images,
          dates: pkg.dates.map((d) => d.slice(0, 10)),
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        inclusions: form.inclusions.filter(Boolean),
        exclusions: form.exclusions.filter(Boolean),
        highlights: form.highlights.filter(Boolean),
        images: form.images.filter(Boolean),
        dates: form.dates.filter(Boolean),
        itinerary: form.itinerary.filter((d) => d.title.trim()),
        slabId: form.slabId || null,
        slabLabel: form.slabLabel || null,
        typeId: form.typeId || null,
        typeLabel: form.typeLabel || null,
        popular: form.popular,
      };
      const r = await fetch("/api/agency/packages", {
        method: pkg ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkg ? { id: pkg.id, input: payload } : payload),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? "Could not save package");
      }
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const currentTier = tiers.find((t) => t.label === form.slabLabel);
  const priceOutOfBand =
    currentTier &&
    (form.price < currentTier.minPerHead ||
      (currentTier.maxPerHead != null && form.price >= currentTier.maxPerHead));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[110] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <h3 className="font-semibold text-slate-900">{pkg ? "Edit package" : "New package"}</h3>
            {pkg && (
              <p className="text-xs text-amber-600">Saving re-submits it for admin approval.</p>
            )}
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <Text label="Package name" value={form.name} onChange={(v) => set({ name: v })} placeholder="Goa Beach Escape" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Destination</Label>
              <select value={form.destinationId} onChange={(e) => set({ destinationId: e.target.value })} className={inputCls}>
                <option value="">Select a destination…</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Budget slab</Label>
              <select
                value={form.slabLabel}
                onChange={(e) => {
                  const t = tiers.find((x) => x.label === e.target.value);
                  set({ slabLabel: e.target.value, slabId: t?.id ?? "" });
                }}
                className={inputCls}
              >
                <option value="">Select a slab…</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.label}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Trip type</Label>
            <select
              value={form.typeId}
              onChange={(e) => {
                const t = tripTypes.find((x) => x.id === e.target.value);
                set({ typeId: e.target.value, typeLabel: t?.name ?? "" });
              }}
              className={inputCls}
            >
              <option value="">Select a trip type…</option>
              {tripTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Controls which menu category + homepage tab this package appears under.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Text label="Duration" value={form.duration} onChange={(v) => set({ duration: v })} placeholder="6N/7D" />
            <NumberField label="Total days" value={form.durationDays} onChange={(v) => set({ durationDays: v })} />
            <NumberField label="Price / person (₹)" value={form.price} onChange={(v) => set({ price: v })} />
          </div>
          {priceOutOfBand && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Heads up: ₹{form.price.toLocaleString("en-IN")} is outside the selected
              slab ({currentTier?.label}). Travellers filter by slab, so pick the
              matching band or adjust the price.
            </p>
          )}
          <NumberField label="Max travellers (0 = no limit)" value={form.maxTravelers} onChange={(v) => set({ maxTravelers: v })} />

          <div>
            <Label>Description</Label>
            <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={4} placeholder="What makes this trip special…" className={inputCls} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ChipListEditor label="Highlights" items={form.highlights} onChange={(v) => set({ highlights: v })} placeholder="Sunset cruise" />
            <ChipListEditor label="Inclusions" items={form.inclusions} onChange={(v) => set({ inclusions: v })} placeholder="4-star stay" />
            <ChipListEditor label="Exclusions" items={form.exclusions} onChange={(v) => set({ exclusions: v })} placeholder="Airfare" />
          </div>

          <div>
            <Label>Gallery photos</Label>
            <GalleryUploader values={form.images} onChange={(v) => set({ images: v })} max={12} />
          </div>

          <div>
            <Label>Itinerary (optional)</Label>
            <ItineraryEditor items={form.itinerary} onChange={(v) => set({ itinerary: v })} />
          </div>

          <div>
            <Label>Departure dates</Label>
            <DatesEditor dates={form.dates} onChange={(v) => set({ dates: v })} />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(e) => set({ popular: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-indigo-600"
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Request a spot in “Popular packages”
              </span>
              <span className="block text-xs text-slate-500">
                Shown on the homepage’s Popular packages shelf once approved. An admin can
                also add or remove it there.
              </span>
            </span>
          </label>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => {
              setError("");
              if (!form.name.trim() || !form.destinationId || !form.description.trim() || form.price <= 0)
                return setError("Name, destination, description and a price are required.");
              save.mutate();
            }}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {pkg ? "Save & resubmit" : "Submit for approval"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- light field primitives -------------------------------------------------

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-slate-700">{children}</span>;
}
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </label>
  );
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} className={inputCls} />
    </label>
  );
}

function ChipListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v) onChange([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <Label>{label}</Label>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
              {it}
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder ?? "Type and press Enter"}
        className={inputCls}
      />
    </div>
  );
}

function ItineraryEditor({ items, onChange }: { items: ItinDay[]; onChange: (v: ItinDay[]) => void }) {
  const update = (i: number, patch: Partial<ItinDay>) =>
    onChange(items.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  return (
    <div className="space-y-2">
      {items.map((d, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-600">Day {d.day}</span>
            <input value={d.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title (e.g. Arrival & beach walk)" className={inputCls} />
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, day: idx + 1 })))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-rose-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea value={d.detail} onChange={(e) => update(i, { detail: e.target.value })} placeholder="What happens on this day…" rows={2} className={`${inputCls} mt-2`} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { day: items.length + 1, title: "", detail: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
        <Plus className="h-3.5 w-3.5" /> Add day
      </button>
    </div>
  );
}

function DatesEditor({ dates, onChange }: { dates: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      {dates.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {dates.map((d, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">
              {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              <button type="button" onClick={() => onChange(dates.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="date" value={draft} onChange={(e) => setDraft(e.target.value)} className={inputCls} />
        <button
          type="button"
          onClick={() => {
            if (draft && !dates.includes(draft)) onChange([...dates, draft].sort());
            setDraft("");
          }}
          className="shrink-0 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
