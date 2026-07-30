"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import {
  Check,
  PauseCircle,
  Ban,
  KeyRound,
  Loader2,
  Receipt,
  FileText,
  Search,
  MapPin,
} from "lucide-react";
import { AdminCard, PageHeading, StatusBadge, ActionButton } from "./ui";
import { AgencyDocumentsModal } from "./agency-documents-modal";
import { formatINR } from "@/lib/utils";
import type { AdminAgency } from "@/server/admin-repo";

type SortKey = "recent" | "purchases" | "spend";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "SUSPENDED", "BLOCKED"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export function AgenciesTable() {
  const qc = useQueryClient();
  const [docsFor, setDocsFor] = useState<AdminAgency | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async (): Promise<{ agencies: AdminAgency[] }> => {
      const r = await fetch("/api/admin/agencies");
      return r.json();
    },
    // Poll so newly registered agencies appear without a manual refresh.
    refetchInterval: 15000,
  });

  const action = useMutation({
    mutationFn: async (body: { id: string; action: string }) => {
      const r = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agencies"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const agencies = data?.agencies ?? [];

  // Per-status counts for the filter chips (from the full, unsearched list).
  const counts: Record<StatusTab, number> = {
    ALL: agencies.length,
    PENDING: 0,
    APPROVED: 0,
    SUSPENDED: 0,
    BLOCKED: 0,
  };
  for (const a of agencies) counts[a.status as StatusTab]++;

  const q = search.trim().toLowerCase();
  const hasFilter = q.length > 0 || statusTab !== "ALL";
  const filtered = agencies
    .filter((a) => statusTab === "ALL" || a.status === statusTab)
    .filter(
      (a) =>
        !q ||
        [a.name, a.ownerName, a.email, a.city, a.gstNumber, a.phone].some((f) =>
          f?.toLowerCase().includes(q),
        ),
    )
    .sort((a, b) => {
      if (sort === "purchases") return b.purchases - a.purchases;
      if (sort === "spend") return b.spend - a.spend;
      return 0; // "recent" — API already returns newest-first
    });

  return (
    <div>
      <PageHeading title="Agency Management" subtitle="Approve, suspend, block or reset agencies" />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setStatusTab(t)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              statusTab === t
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                : "text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {t}
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                statusTab === t ? "bg-violet-500/30 text-violet-100" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city, name, GST, email…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {hasFilter ? `${filtered.length} of ${agencies.length}` : agencies.length} agenc
            {(hasFilter ? filtered.length : agencies.length) === 1 ? "y" : "ies"}
          </span>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-white outline-none focus:border-violet-500"
            >
              <option value="recent">Newest</option>
              <option value="purchases">Most leads bought</option>
              <option value="spend">Highest spend</option>
            </select>
          </label>
        </div>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Agency</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Documents</th>
                <th className="px-4 py-3 font-medium">Purchases</th>
                <th className="px-4 py-3 font-medium">Spend</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500">
                    {q
                      ? `No agencies match “${search}”.`
                      : statusTab !== "ALL"
                        ? `No ${statusTab.toLowerCase()} agencies.`
                        : "No agencies yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{a.name}</div>
                      <div className="text-[11px] text-zinc-500">
                        {a.ownerName} · {a.email}
                      </div>
                      {a.city && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-400">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          {a.city}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {a.gstNumber || <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDocsFor(a)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          a.documents.length
                            ? "border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                            : "border-zinc-700 text-zinc-500 hover:bg-zinc-800"
                        }`}
                        title="Review KYC documents"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {a.documents.length
                          ? `${a.documents.length} file${a.documents.length === 1 ? "" : "s"}`
                          : "Review"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-zinc-300">
                        <Receipt className="h-3.5 w-3.5 text-zinc-500" />
                        {a.purchases}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{formatINR(a.spend)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {a.status !== "APPROVED" && (
                          <ActionButton
                            tone="success"
                            onClick={() => action.mutate({ id: a.id, action: "approve" })}
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </ActionButton>
                        )}
                        {a.status !== "SUSPENDED" && (
                          <ActionButton
                            tone="warning"
                            onClick={() => action.mutate({ id: a.id, action: "suspend" })}
                          >
                            <PauseCircle className="h-3.5 w-3.5" /> Suspend
                          </ActionButton>
                        )}
                        {a.status !== "BLOCKED" && (
                          <ActionButton
                            tone="danger"
                            onClick={() => action.mutate({ id: a.id, action: "block" })}
                          >
                            <Ban className="h-3.5 w-3.5" /> Block
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => action.mutate({ id: a.id, action: "reset_password" })}
                          title="Send password reset"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
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

      <AnimatePresence>
        {docsFor && (
          <AgencyDocumentsModal
            agency={docsFor}
            busy={action.isPending}
            onClose={() => setDocsFor(null)}
            onAction={(act) => {
              action.mutate({ id: docsFor.id, action: act });
              setDocsFor(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
