"use client";

import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { SLABS } from "@/lib/slabs";
import { useAgency } from "@/store/agency";

export function MarketFilters({ destinations }: { destinations: string[] }) {
  const { filters, setFilter, resetFilters } = useAgency();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          Filters
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Select
          label="Budget slab"
          value={filters.slab ?? ""}
          onChange={(v) => setFilter({ slab: (v || "") as never })}
        >
          <option value="">All slabs</option>
          {SLABS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>

        <Select
          label="Destination"
          value={filters.destination}
          onChange={(v) => setFilter({ destination: v })}
        >
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>

        <Select
          label="Min lead score"
          value={String(filters.minScore)}
          onChange={(v) => setFilter({ minScore: Number(v) })}
        >
          {[0, 55, 65, 75, 85].map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Any score" : `${n}+`}
            </option>
          ))}
        </Select>

        <Select
          label="Sort by"
          value={filters.sort}
          onChange={(v) => setFilter({ sort: v as never })}
        >
          <option value="newest">Newest</option>
          <option value="score">Highest score</option>
          <option value="priceLow">Price: low to high</option>
          <option value="priceHigh">Price: high to low</option>
        </Select>

        <label className="flex items-end pb-1">
          <span className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={filters.hideSold}
              onChange={(e) => setFilter({ hideSold: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Hide sold
          </span>
        </label>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {children}
      </select>
    </label>
  );
}
