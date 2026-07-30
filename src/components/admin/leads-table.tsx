"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EyeOff, Eye, ShieldX, Trash2, Loader2, MapPin } from "lucide-react";
import { AdminCard, PageHeading, StatusBadge, ActionButton } from "./ui";
import { formatINR } from "@/lib/utils";
import { getSlab } from "@/lib/slabs";
import type { AdminLeadRow } from "@/server/lead-repo";
import type { LeadStats } from "@/server/lead-repo";

const STATUS_TABS = ["ALL", "AVAILABLE", "NEW", "HIDDEN", "FRAUD"] as const;

export function LeadsTable() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("ALL");
  const [dest, setDest] = useState("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads", tab],
    queryFn: async (): Promise<{ leads: AdminLeadRow[]; stats: LeadStats }> => {
      const q = tab === "ALL" ? "" : `?status=${tab}`;
      const r = await fetch(`/api/admin/leads${q}`);
      return r.json();
    },
  });

  const action = useMutation({
    mutationFn: async (body: {
      id: string;
      action: string;
      status?: string;
    }) => {
      const r = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const leads = data?.leads ?? [];
  const destinations = Array.from(new Set(leads.map((l) => l.destination))).sort();
  const visible = dest === "ALL" ? leads : leads.filter((l) => l.destination === dest);

  return (
    <div>
      <PageHeading title="Lead Management" subtitle="Edit, hide, assign or flag leads" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab === t
                  ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {visible.length} lead{visible.length === 1 ? "" : "s"}
          </span>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <MapPin className="h-3.5 w-3.5 text-zinc-500" />
            <select
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="ALL">All destinations</option>
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Lead ID</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Budget</th>
                <th className="px-4 py-3 font-medium">Slab</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    {dest === "ALL"
                      ? "No leads in this view."
                      : `No leads for ${dest} in this view.`}
                  </td>
                </tr>
              ) : (
                visible.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-zinc-300">{l.reference}</div>
                      <div className="text-[11px] text-zinc-500">{l.travelerName}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{l.destination}</td>
                    <td className="px-4 py-3 text-zinc-300">{formatINR(l.budget)}</td>
                    <td className="px-4 py-3 text-zinc-400">{getSlab(l.slab).label}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-white">{l.leadScore}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {l.status === "HIDDEN" ? (
                          <ActionButton
                            tone="success"
                            onClick={() => action.mutate({ id: l.id, action: "unhide" })}
                            title="Unhide"
                          >
                            <Eye className="h-3.5 w-3.5" /> Unhide
                          </ActionButton>
                        ) : (
                          <ActionButton
                            onClick={() => action.mutate({ id: l.id, action: "hide" })}
                            title="Hide from marketplace"
                          >
                            <EyeOff className="h-3.5 w-3.5" /> Hide
                          </ActionButton>
                        )}
                        <ActionButton
                          tone="warning"
                          onClick={() => action.mutate({ id: l.id, action: "mark_fraud" })}
                          title="Mark as fraud"
                        >
                          <ShieldX className="h-3.5 w-3.5" /> Fraud
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() => action.mutate({ id: l.id, action: "delete" })}
                          title="Delete lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
