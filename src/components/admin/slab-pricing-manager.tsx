"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Loader2, RotateCcw, Check } from "lucide-react";
import { AdminCard, PageHeading } from "./ui";
import { formatINR } from "@/lib/utils";

interface SlabPriceRow {
  slab: string;
  label: string;
  min: number;
  max: number;
  defaultPrice: number;
  price: number;
  customized: boolean;
}

export function SlabPricingManager() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-slab-pricing"],
    queryFn: async (): Promise<{ pricing: SlabPriceRow[] }> =>
      (await fetch("/api/admin/slab-pricing")).json(),
  });

  const save = useMutation({
    mutationFn: async (body: { slab: string; price: number | null }) => {
      const r = await fetch("/api/admin/slab-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-slab-pricing"] }),
  });

  const rows = data?.pricing ?? [];

  return (
    <div>
      <PageHeading
        title="Slab Pricing"
        subtitle="Set the price an agency pays to unlock a lead in each budget slab. Applies to new leads."
      />

      {isLoading ? (
        <div className="py-20 text-center text-zinc-500">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <AdminCard className="divide-y divide-zinc-800/70">
          {rows.map((row) => (
            <PricingRow
              key={row.slab}
              row={row}
              saving={save.isPending && save.variables?.slab === row.slab}
              onSave={(price) => save.mutate({ slab: row.slab, price })}
            />
          ))}
        </AdminCard>
      )}

      <p className="mt-4 text-xs text-zinc-500">
        Changing a price only affects leads created afterwards — already-created
        leads keep the price they were captured at.
      </p>
    </div>
  );
}

function PricingRow({
  row,
  saving,
  onSave,
}: {
  row: SlabPriceRow;
  saving: boolean;
  onSave: (price: number | null) => void;
}) {
  const [value, setValue] = useState(String(row.price));

  // Keep the input in sync when the server value changes (after save/reset).
  useEffect(() => setValue(String(row.price)), [row.price]);

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed >= 0 && Number.isInteger(parsed);
  const dirty = valid && parsed !== row.price;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{row.label}</span>
          {row.customized ? (
            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300">
              Custom
            </span>
          ) : (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Default
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          Default {formatINR(row.defaultPrice)} · per traveller budget band
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-zinc-700 bg-zinc-950 pl-2.5 focus-within:border-violet-500">
          <IndianRupee className="h-3.5 w-3.5 text-zinc-500" />
          <input
            value={value}
            inputMode="numeric"
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            className="w-24 bg-transparent px-2 py-2 text-sm text-white outline-none"
          />
        </div>

        <button
          onClick={() => dirty && onSave(parsed)}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-600 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save
        </button>

        {row.customized && (
          <button
            onClick={() => onSave(null)}
            disabled={saving}
            title="Reset to default"
            className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
