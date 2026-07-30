"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Loader2, Trash2, Check, Plus, EyeOff } from "lucide-react";
import { AdminCard, PageHeading } from "./ui";
import { formatINR } from "@/lib/utils";

interface SlabTier {
  id: string;
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
  leadPrice: number;
  autoHide: boolean;
  order: number;
}

const digits = (s: string) => s.replace(/[^\d]/g, "");

export function SlabTiersManager() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-slab-tiers"] });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-slab-tiers"],
    queryFn: async (): Promise<{ tiers: SlabTier[] }> =>
      (await fetch("/api/admin/slab-tiers")).json(),
  });

  const tiers = data?.tiers ?? [];

  return (
    <div>
      <PageHeading
        title="Slab Ranges & Pricing"
        subtitle="Define the per-traveller budget ranges. Each sets the lead unlock price, auto-hide, and the slab label shown in the admin panel + traveler dashboard. Applies to new leads."
      />

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <AdminCard className="divide-y divide-zinc-800/70">
          <div className="hidden gap-3 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <span>Label</span>
            <span>Min / traveller</span>
            <span>Max / traveller</span>
            <span>Lead price</span>
            <span className="text-right">Auto-hide · actions</span>
          </div>
          {tiers.map((t) => (
            <TierRow key={t.id} tier={t} onChanged={invalidate} />
          ))}
        </AdminCard>
      )}

      <AddTierForm onCreated={invalidate} />

      <p className="mt-4 text-xs text-zinc-500">
        Leads are categorised by <b className="text-zinc-400">budget ÷ travellers</b>.
        Leave <b className="text-zinc-400">Max</b> empty for the top, open-ended
        range. <b className="text-amber-400/90">Auto-hide</b> keeps new leads in a
        range hidden until you release them from Lead Management. Ranges only
        affect leads created afterwards.
      </p>
    </div>
  );
}

function TierRow({ tier, onChanged }: { tier: SlabTier; onChanged: () => void }) {
  const [label, setLabel] = useState(tier.label);
  const [min, setMin] = useState(String(tier.minPerHead));
  const [max, setMax] = useState(tier.maxPerHead == null ? "" : String(tier.maxPerHead));
  const [price, setPrice] = useState(String(tier.leadPrice));
  const [err, setErr] = useState("");

  // Re-sync when the server row changes (after save).
  useEffect(() => {
    setLabel(tier.label);
    setMin(String(tier.minPerHead));
    setMax(tier.maxPerHead == null ? "" : String(tier.maxPerHead));
    setPrice(String(tier.leadPrice));
  }, [tier.label, tier.minPerHead, tier.maxPerHead, tier.leadPrice]);

  const save = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const r = await fetch("/api/admin/slab-tiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tier.id, ...patch }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? "Save failed");
      }
    },
    onSuccess: () => {
      setErr("");
      onChanged();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/slab-tiers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tier.id }),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: onChanged,
  });

  const minN = Number(min);
  const maxN = max === "" ? null : Number(max);
  const priceN = Number(price);
  const valid =
    label.trim().length > 0 &&
    Number.isFinite(minN) &&
    Number.isFinite(priceN) &&
    (maxN == null || maxN > minN);
  const dirty =
    label !== tier.label ||
    minN !== tier.minPerHead ||
    maxN !== tier.maxPerHead ||
    priceN !== tier.leadPrice;

  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. ₹1,00,000 – ₹2,00,000"
        className={inputCls}
      />
      <RupeeInput value={min} onChange={(v) => setMin(digits(v))} placeholder="0" />
      <RupeeInput value={max} onChange={(v) => setMax(digits(v))} placeholder="∞ (top)" />
      <RupeeInput value={price} onChange={(v) => setPrice(digits(v))} placeholder="0" />

      <div className="flex items-center justify-end gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-400">
          {tier.autoHide ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : null}
          <Toggle
            checked={tier.autoHide}
            disabled={save.isPending}
            onChange={(next) => save.mutate({ autoHide: next })}
          />
        </label>
        <button
          onClick={() =>
            valid &&
            dirty &&
            save.mutate({ label: label.trim(), minPerHead: minN, maxPerHead: maxN, leadPrice: priceN })
          }
          disabled={!valid || !dirty || save.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-600 disabled:opacity-40"
        >
          {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete the "${tier.label}" range?`)) remove.mutate();
          }}
          disabled={remove.isPending}
          title="Delete range"
          className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {err && <p className="text-xs text-rose-400 md:col-span-5">{err}</p>}
      <p className="text-[11px] text-zinc-600 md:col-span-5">
        {formatINR(tier.minPerHead)} – {tier.maxPerHead == null ? "∞" : formatINR(tier.maxPerHead)} · unlock {formatINR(tier.leadPrice)}
        {tier.autoHide ? " · auto-hidden" : ""}
      </p>
    </div>
  );
}

function AddTierForm({ onCreated }: { onCreated: () => void }) {
  const [label, setLabel] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [price, setPrice] = useState("");
  const [autoHide, setAutoHide] = useState(false);
  const [err, setErr] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/slab-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          minPerHead: Number(min),
          maxPerHead: max === "" ? null : Number(max),
          leadPrice: Number(price),
          autoHide,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error ?? "Could not add the range");
      }
    },
    onSuccess: () => {
      setLabel("");
      setMin("");
      setMax("");
      setPrice("");
      setAutoHide(false);
      setErr("");
      onCreated();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const minN = Number(min);
  const maxN = max === "" ? null : Number(max);
  const valid =
    label.trim().length > 0 &&
    min !== "" &&
    Number.isFinite(minN) &&
    price !== "" &&
    Number.isFinite(Number(price)) &&
    (maxN == null || maxN > minN);

  return (
    <AdminCard className="mt-5 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <Plus className="h-4 w-4 text-violet-400" /> Add a slab range
      </h3>
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-center">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label — e.g. ₹1,00,000 – ₹2,00,000"
          className={inputCls}
        />
        <RupeeInput value={min} onChange={(v) => setMin(digits(v))} placeholder="Min /traveller" />
        <RupeeInput value={max} onChange={(v) => setMax(digits(v))} placeholder="Max (blank = ∞)" />
        <RupeeInput value={price} onChange={(v) => setPrice(digits(v))} placeholder="Lead price" />
        <div className="flex items-center justify-end gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-400">
            Hide
            <Toggle checked={autoHide} onChange={setAutoHide} />
          </label>
          <button
            onClick={() => valid && create.mutate()}
            disabled={!valid || create.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>
      </div>
      {err && <p className="mt-2 text-xs text-rose-400">{err}</p>}
    </AdminCard>
  );
}

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500";

function RupeeInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-950 pl-2.5 focus-within:border-violet-500">
      <IndianRupee className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
      <input
        value={value}
        inputMode="numeric"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-amber-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
