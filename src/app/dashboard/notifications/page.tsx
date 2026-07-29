"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { PageTitle, DashCard, EmptyState, relativeTime } from "@/components/dashboard/ui";

interface Notif {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAtISO: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["traveler-notifications"],
    queryFn: async (): Promise<{ items: Notif[] }> =>
      (await fetch("/api/traveler/notifications")).json(),
    refetchInterval: 30_000,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await fetch("/api/traveler/notifications", { method: "POST" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["traveler-notifications"] });
      qc.invalidateQueries({ queryKey: ["auth-session"] }); // reset navbar badge
    },
  });

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <div>
      <PageTitle
        title="Notifications"
        subtitle="Updates about your trips and matched agencies."
        action={
          hasUnread ? (
            <button
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {markAll.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all read
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="You're all caught up"
          hint="Notifications about your trips will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <DashCard className={`flex gap-3 p-4 ${n.read ? "" : "ring-1 ring-primary/20"}`}>
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    n.read ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Bell className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{relativeTime(n.createdAtISO)}</p>
                </div>
              </DashCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
