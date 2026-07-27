"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, PauseCircle, Ban, KeyRound, Loader2, Receipt } from "lucide-react";
import { AdminCard, PageHeading, StatusBadge, ActionButton } from "./ui";
import { formatINR } from "@/lib/utils";
import type { AdminAgency } from "@/server/admin-repo";

export function AgenciesTable() {
  const qc = useQueryClient();

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

  return (
    <div>
      <PageHeading title="Agency Management" subtitle="Approve, suspend, block or reset agencies" />

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Agency</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Purchases</th>
                <th className="px-4 py-3 font-medium">Spend</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                agencies.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{a.name}</div>
                      <div className="text-[11px] text-zinc-500">
                        {a.ownerName} · {a.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {a.gstNumber}
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
    </div>
  );
}
