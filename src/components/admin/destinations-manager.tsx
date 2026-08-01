"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  X,
  Save,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { AdminCard, PageHeading, StatusBadge, ActionButton } from "./ui";
import { SingleImageUploader, GalleryUploader } from "@/components/shared/image-uploader";
import { formatINR } from "@/lib/utils";
import type { DestinationSummary, DestinationStatus } from "@/server/destination-repo";

interface FaqItem { question: string; answer: string }
interface ReviewItem { author: string; rating: number; comment: string }

interface FormState {
  name: string;
  slug: string;
  region: string;
  scope: "India" | "World";
  heroImage: string;
  gallery: string[];
  description: string;
  bestTime: string;
  idealDuration: string;
  highlights: string[];
  tags: string[];
  startingFrom: number;
  status: DestinationStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  faqs: FaqItem[];
  reviews: ReviewItem[];
}

const EMPTY: FormState = {
  name: "",
  slug: "",
  region: "",
  scope: "India",
  heroImage: "",
  gallery: [],
  description: "",
  bestTime: "",
  idealDuration: "",
  highlights: [],
  tags: [],
  startingFrom: 0,
  status: "PUBLISHED",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  faqs: [],
  reviews: [],
};

async function api(body: unknown) {
  const r = await fetch("/api/admin/destinations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d?.error ?? "Request failed");
  }
  return r.json();
}

export function DestinationsManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-destinations"],
    queryFn: async (): Promise<{ destinations: DestinationSummary[] }> =>
      (await fetch("/api/admin/destinations")).json(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-destinations"] });

  const patch = useMutation({
    mutationFn: (body: { id: string; patch: Record<string, unknown> }) =>
      api({ action: "patch", id: body.id, patch: body.patch }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api({ action: "delete", id }),
    onSuccess: invalidate,
  });

  const destinations = data?.destinations ?? [];

  return (
    <div>
      <PageHeading
        title="Destinations"
        subtitle="Create, edit, hide and feature the destinations shown across the site"
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add destination
          </button>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {destinations.map((d) => (
            <AdminCard key={d.id} className="overflow-hidden">
              <div className="relative aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.heroImage} alt={d.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute left-2 top-2 flex gap-1.5">
                  <StatusBadge status={d.status} />
                  {d.featured && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      <Star className="h-2.5 w-2.5 fill-current" /> Featured
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-2 bottom-2 text-white">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/70">
                    <MapPin className="h-3 w-3" /> {d.region} · {d.scope}
                  </div>
                  <div className="font-display text-lg font-bold leading-tight">{d.name}</div>
                  <div className="text-xs text-white/80">From {formatINR(d.startingFrom)}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800 p-2.5">
                <ActionButton onClick={() => setEditing(d.id)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </ActionButton>
                <ActionButton
                  tone={d.status === "PUBLISHED" ? "warning" : "success"}
                  onClick={() =>
                    patch.mutate({
                      id: d.id,
                      patch: { status: d.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED" },
                    })
                  }
                >
                  {d.status === "PUBLISHED" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {d.status === "PUBLISHED" ? "Hide" : "Publish"}
                </ActionButton>
                <ActionButton
                  tone={d.featured ? "warning" : "default"}
                  onClick={() => patch.mutate({ id: d.id, patch: { featured: !d.featured } })}
                >
                  <Star className={`h-3.5 w-3.5 ${d.featured ? "fill-current" : ""}`} />
                </ActionButton>
                <a
                  href={`/destinations/${d.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <ActionButton
                  tone="danger"
                  className="ml-auto"
                  onClick={() => {
                    if (confirm(`Delete "${d.name}"? This also removes its packages' link.`))
                      remove.mutate(d.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </ActionButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <DestinationEditor
            id={editing === "new" ? null : editing}
            initial={
              editing === "new"
                ? null
                : destinations.find((d) => d.id === editing) ?? null
            }
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

function DestinationEditor({
  id,
  initial,
  onClose,
  onSaved,
}: {
  id: string | null;
  initial: DestinationSummary | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          ...EMPTY,
          ...initial,
          faqs: [],
          reviews: [],
          seoTitle: initial.seoTitle ?? "",
          seoDescription: initial.seoDescription ?? "",
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const [loadedFaqs, setLoadedFaqs] = useState(false);

  // The summary list omits faqs/reviews — fetch the full record for edit mode
  // and merge them in once (leave the rest of the form, seeded from `initial`).
  const { data: record } = useQuery({
    queryKey: ["admin-destination-full", id],
    enabled: Boolean(id) && !loadedFaqs,
    queryFn: async () => {
      const r = await fetch(`/api/admin/destinations/${id}`);
      if (!r.ok) return null;
      return (await r.json()).destination as {
        faqs: FaqItem[];
        reviews: ReviewItem[];
      } | null;
    },
  });
  if (record && !loadedFaqs) {
    setLoadedFaqs(true);
    setForm((f) => ({ ...f, faqs: record.faqs ?? [], reviews: record.reviews ?? [] }));
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        highlights: form.highlights.map((s) => s.trim()).filter(Boolean),
        tags: form.tags.map((s) => s.trim()).filter(Boolean),
        gallery: form.gallery.filter(Boolean),
        faqs: form.faqs.filter((f) => f.question.trim() && f.answer.trim()),
        reviews: form.reviews.filter((r) => r.author.trim() && r.comment.trim()),
      };
      return api(id ? { action: "update", id, input: payload } : { action: "create", input: payload });
    },
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

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
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-5 py-4 backdrop-blur">
          <h3 className="font-semibold text-white">{id ? "Edit destination" : "New destination"}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {(
          <div className="space-y-5 p-5">
            <div>
              <Label>Hero image</Label>
              <SingleImageUploader dark value={form.heroImage} onChange={(v) => set({ heroImage: v })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Name" value={form.name} onChange={(v) => set({ name: v })} placeholder="Goa" />
              <Text label="Slug (optional)" value={form.slug} onChange={(v) => set({ slug: v })} placeholder="auto from name" />
              <Text label="Region" value={form.region} onChange={(v) => set({ region: v })} placeholder="West India" />
              <div>
                <Label>Scope</Label>
                <select value={form.scope} onChange={(e) => set({ scope: e.target.value as "India" | "World" })} className={inputCls}>
                  <option value="India">India</option>
                  <option value="World">World</option>
                </select>
              </div>
              <Text label="Best time to visit" value={form.bestTime} onChange={(v) => set({ bestTime: v })} placeholder="November – February" />
              <Text label="Ideal duration" value={form.idealDuration} onChange={(v) => set({ idealDuration: v })} placeholder="3–5 days" />
              <NumberField label="Starting from (₹ / person)" value={form.startingFrom} onChange={(v) => set({ startingFrom: v })} />
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => set({ status: e.target.value as DestinationStatus })} className={inputCls}>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                rows={4}
                placeholder="A vivid 2–3 sentence intro to the destination…"
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ChipListEditor label="Highlights" items={form.highlights} onChange={(v) => set({ highlights: v })} placeholder="Sunset at Palolem" />
              <ChipListEditor label="Tags / known for" items={form.tags} onChange={(v) => set({ tags: v })} placeholder="Beaches" />
            </div>

            <div>
              <Label>Gallery</Label>
              <GalleryUploader dark values={form.gallery} onChange={(v) => set({ gallery: v })} max={10} />
            </div>

            <div>
              <Label>FAQs</Label>
              <FaqEditor items={form.faqs} onChange={(v) => set({ faqs: v })} />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-violet-500" />
              Feature on homepage
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="SEO title (optional)" value={form.seoTitle} onChange={(v) => set({ seoTitle: v })} />
              <Text label="SEO description (optional)" value={form.seoDescription} onChange={(v) => set({ seoDescription: v })} />
            </div>

            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
          </div>
        )}

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-800 bg-zinc-900/95 px-5 py-4 backdrop-blur">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800">
            Cancel
          </button>
          <button
            onClick={() => {
              setError("");
              if (!form.name.trim() || !form.heroImage || !form.region.trim() || !form.description.trim())
                return setError("Name, region, hero image and description are required.");
              save.mutate();
            }}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {id ? "Save changes" : "Create destination"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- small field primitives -------------------------------------------------

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-violet-500";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">{children}</span>;
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
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={inputCls}
      />
    </label>
  );
}

/** Comma / enter separated chip list. */
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
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200">
            {it}
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-zinc-500 hover:text-rose-300">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
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

function FaqEditor({ items, onChange }: { items: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
  const update = (i: number, patch: Partial<FaqItem>) =>
    onChange(items.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  return (
    <div className="space-y-2">
      {items.map((f, i) => (
        <div key={i} className="rounded-lg border border-zinc-800 p-2.5">
          <div className="flex gap-2">
            <input value={f.question} onChange={(e) => update(i, { question: e.target.value })} placeholder="Question" className={inputCls} />
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-rose-300">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <textarea value={f.answer} onChange={(e) => update(i, { answer: e.target.value })} placeholder="Answer" rows={2} className={`${inputCls} mt-2`} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { question: "", answer: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800">
        <Plus className="h-3.5 w-3.5" /> Add FAQ
      </button>
    </div>
  );
}
