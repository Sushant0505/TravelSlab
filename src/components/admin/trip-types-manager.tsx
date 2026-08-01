"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Save, GripVertical } from "lucide-react";
import { AdminCard, PageHeading, ActionButton } from "./ui";
import { TripTypeIcon, TRIP_TYPE_ICON_NAMES } from "@/components/shared/trip-type-icon";
import type { TripTypeRecord } from "@/server/trip-type-repo";

interface FormState {
  name: string;
  slug: string;
  subtitle: string;
  icon: string;
  active: boolean;
}
const EMPTY: FormState = { name: "", slug: "", subtitle: "", icon: "Compass", active: true };

async function api(body: unknown) {
  const r = await fetch("/api/admin/trip-types", {
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

export function TripTypesManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TripTypeRecord | "new" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-trip-types"],
    queryFn: async (): Promise<{ types: TripTypeRecord[] }> =>
      (await fetch("/api/admin/trip-types")).json(),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-trip-types"] });

  const patch = useMutation({
    mutationFn: (b: { id: string; patch: Record<string, unknown> }) =>
      api({ action: "patch", id: b.id, patch: b.patch }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api({ action: "delete", id }),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (b: { id: string; order: number }) => api({ action: "patch", id: b.id, patch: { order: b.order } }),
    onSuccess: invalidate,
  });

  const types = data?.types ?? [];

  const move = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= types.length) return;
    // swap order values
    reorder.mutate({ id: types[i].id, order: types[j].order });
    reorder.mutate({ id: types[j].id, order: types[i].order });
  };

  return (
    <div>
      <PageHeading
        title="Trip Types"
        subtitle="Categories shown in the menu + homepage tabs. Agencies tag each package with one."
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Add type
          </button>
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-2">
          {types.map((t, i) => (
            <AdminCard key={t.id} className={`flex items-center gap-3 p-3 ${t.active ? "" : "opacity-50"}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-zinc-500 hover:text-white disabled:opacity-20">
                  <GripVertical className="h-3 w-3 rotate-90" />
                </button>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                <TripTypeIcon name={t.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white">{t.name}</div>
                <div className="truncate text-xs text-zinc-500">
                  {t.subtitle || "—"} · <span className="font-mono">/{t.slug}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <ActionButton
                  tone={t.active ? "warning" : "success"}
                  onClick={() => patch.mutate({ id: t.id, patch: { active: !t.active } })}
                >
                  {t.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {t.active ? "Hide" : "Show"}
                </ActionButton>
                <ActionButton onClick={() => setEditing(t)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </ActionButton>
                <ActionButton
                  tone="danger"
                  onClick={() => {
                    if (confirm(`Delete "${t.name}"? Existing packages keep their label.`)) remove.mutate(t.id);
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
          <Editor
            type={editing === "new" ? null : editing}
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

function Editor({
  type,
  onClose,
  onSaved,
}: {
  type: TripTypeRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() =>
    type
      ? { name: type.name, slug: type.slug, subtitle: type.subtitle, icon: type.icon, active: type.active }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const save = useMutation({
    mutationFn: () =>
      api(type ? { action: "update", id: type.id, input: form } : { action: "create", input: form }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

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
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="font-semibold text-white">{type ? "Edit trip type" : "New trip type"}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Name</span>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Backpacking Trips" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Subtitle</span>
            <input value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Budget group adventures" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Slug (optional)</span>
            <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="auto from name" className={inputCls} />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Icon</span>
            <div className="flex flex-wrap gap-1.5">
              {TRIP_TYPE_ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => set({ icon: name })}
                  className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${
                    form.icon === name
                      ? "border-violet-500 bg-violet-500/15 text-violet-300"
                      : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <TripTypeIcon name={name} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4 accent-violet-500" />
            Show in menu / homepage
          </label>

          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800">
            Cancel
          </button>
          <button
            onClick={() => {
              setError("");
              if (form.name.trim().length < 2) return setError("Name is required.");
              save.mutate();
            }}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {type ? "Save" : "Create"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-violet-500";
