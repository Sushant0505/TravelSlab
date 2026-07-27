"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ticket,
  ShieldAlert,
  Building2,
  CheckCheck,
  Bell,
  Loader2,
} from "lucide-react";
import { AdminCard, PageHeading } from "./ui";

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAtISO: string;
}
interface Resp {
  unread: number;
  notifications: Notif[];
}

const KIND_META: Record<
  string,
  { icon: typeof Ticket; tone: string }
> = {
  LEAD_AVAILABLE: { icon: Ticket, tone: "bg-sky-500/15 text-sky-300" },
  SUSPICIOUS: { icon: ShieldAlert, tone: "bg-rose-500/15 text-rose-300" },
  AGENCY_REGISTRATION: { icon: Building2, tone: "bg-violet-500/15 text-violet-300" },
};

export function AdminNotifications() {
  const qc = useQueryClient();

  const feed = useQuery({
    queryKey: ["admin-notifs"],
    queryFn: async (): Promise<Resp> =>
      (await fetch("/api/admin/notifications")).json(),
    refetchInterval: 15000,
  });

  const readAll = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "readAll" }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notifs"] });
      qc.invalidateQueries({ queryKey: ["admin-notif-count"] });
    },
  });

  const notifs = feed.data?.notifications ?? [];

  return (
    <div>
      <PageHeading
        title="Notifications"
        subtitle="New leads, suspicious activity and agency registrations"
        action={
          <button
            onClick={() => readAll.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        }
      />

      <AdminCard className="p-2">
        {feed.isLoading ? (
          <div className="grid place-items-center py-16 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="grid place-items-center gap-2 py-16 text-zinc-500">
            <Bell className="h-7 w-7" />
            No notifications.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800/70">
            {notifs.map((n) => {
              const meta = KIND_META[n.kind] ?? {
                icon: Bell,
                tone: "bg-zinc-500/15 text-zinc-300",
              };
              const Icon = meta.icon;
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 p-4 ${
                    n.read ? "" : "bg-zinc-800/30"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-400">{n.body}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {timeAgo(n.createdAtISO)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
