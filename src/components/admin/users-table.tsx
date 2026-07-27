"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, Loader2, History, AlertTriangle, X } from "lucide-react";
import { AdminCard, PageHeading, StatusBadge, ActionButton } from "./ui";
import type { AdminUser } from "@/server/admin-repo";

export function UsersTable() {
  const qc = useQueryClient();
  const [historyFor, setHistoryFor] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<{ users: AdminUser[] }> => {
      const r = await fetch("/api/admin/users");
      return r.json();
    },
  });

  const action = useMutation({
    mutationFn: async (body: { id: string; action: string }) => {
      const r = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const users = data?.users ?? [];

  return (
    <div>
      <PageHeading title="User Management" subtitle="Block, unblock and review travelers" />

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Traveler</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-white">
                        {u.name}
                        {u.flagged && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-amber-400"
                            aria-label="Flagged for review"
                          />
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{u.mobile}</td>
                    <td className="px-4 py-3 text-zinc-300">{u.leadsSubmitted}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton onClick={() => setHistoryFor(u)}>
                          <History className="h-3.5 w-3.5" /> History
                        </ActionButton>
                        {u.status === "BLOCKED" ? (
                          <ActionButton
                            tone="success"
                            onClick={() => action.mutate({ id: u.id, action: "unblock" })}
                          >
                            <Check className="h-3.5 w-3.5" /> Unblock
                          </ActionButton>
                        ) : (
                          <ActionButton
                            tone="danger"
                            onClick={() => action.mutate({ id: u.id, action: "block" })}
                          >
                            <Ban className="h-3.5 w-3.5" /> Block
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {historyFor && (
        <HistoryModal user={historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </div>
  );
}

function HistoryModal({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">Submission history</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-4 rounded-xl bg-zinc-800/60 p-3 text-sm">
          <div className="font-medium text-white">{user.name}</div>
          <div className="text-zinc-400">
            {user.email} · {user.mobile}
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          {Array.from({ length: user.leadsSubmitted }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
            >
              <span className="text-zinc-300">Lead #{i + 1}</span>
              <span className="text-xs text-zinc-500">
                {i === 0 ? "most recent" : `${i + 1} submissions ago`}
              </span>
            </li>
          ))}
        </ul>
        {user.flagged && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Flagged by abuse detection (rate/fingerprint). Review before unblocking.
          </p>
        )}
      </div>
    </div>
  );
}
