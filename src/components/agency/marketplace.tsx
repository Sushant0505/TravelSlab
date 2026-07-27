"use client";

import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Inbox, Loader2, TrendingUp, ShoppingBag, IndianRupee } from "lucide-react";
import type { MarketplaceLead } from "@/lib/masking";
import { useAgency } from "@/store/agency";
import { MarketFilters } from "./filters";
import { LeadCard } from "./lead-card";
import { BuyModal } from "./buy-modal";
import { formatINR } from "@/lib/utils";

interface ApiResponse {
  ok: boolean;
  count: number;
  destinations: string[];
  leads: MarketplaceLead[];
}

export function Marketplace() {
  const filters = useAgency((s) => s.filters);
  const purchases = useAgency((s) => s.purchases);
  const [buying, setBuying] = useState<MarketplaceLead | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.slab) p.set("slab", filters.slab);
    if (filters.destination) p.set("destination", filters.destination);
    if (filters.minScore) p.set("minScore", String(filters.minScore));
    if (filters.hideSold) p.set("hideSold", "1");
    p.set("sort", filters.sort);
    return p.toString();
  }, [filters]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["agency-leads", qs],
    queryFn: async (): Promise<ApiResponse> => {
      const res = await fetch(`/api/agency/leads?${qs}`);
      if (!res.ok) throw new Error("Failed to load leads");
      return res.json();
    },
    placeholderData: keepPreviousData,
    // Poll so newly submitted leads surface without a manual refresh.
    refetchInterval: 15000,
  });

  const leads = data?.leads ?? [];
  const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<Inbox className="h-5 w-5" />}
          label="Leads available"
          value={String(data?.count ?? "—")}
          tone="indigo"
        />
        <Stat
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Leads purchased"
          value={String(purchases.length)}
          tone="emerald"
        />
        <Stat
          icon={<IndianRupee className="h-5 w-5" />}
          label="Total spent"
          value={formatINR(totalSpent)}
          tone="amber"
        />
      </div>

      <MarketFilters destinations={data?.destinations ?? []} />

      {isLoading ? (
        <div className="grid place-items-center py-24 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-24 text-slate-400">
          <TrendingUp className="h-8 w-8" />
          No leads match these filters. Try widening your criteria.
        </div>
      ) : (
        <div
          className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
            isFetching ? "opacity-70 transition-opacity" : ""
          }`}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onBuy={setBuying} />
          ))}
        </div>
      )}

      <BuyModal
        lead={buying}
        onClose={() => setBuying(null)}
        onPurchased={() => setBuying(null)}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "indigo" | "emerald" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
