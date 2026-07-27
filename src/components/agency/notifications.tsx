"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BellRing,
  CheckCheck,
  Ticket,
  ShoppingBag,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { SlabId } from "@/lib/slabs";

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAtISO: string;
  leadRef?: string;
}
interface NotifResp {
  unread: number;
  notifications: Notif[];
}
interface SlabOpt {
  id: SlabId;
  label: string;
  price: number;
}
interface SubResp {
  slabs: SlabOpt[];
  subscribed: SlabId[];
}

export function AgencyNotifications() {
  const qc = useQueryClient();

  const feed = useQuery({
    queryKey: ["agency-notifs"],
    queryFn: async (): Promise<NotifResp> =>
      (await fetch("/api/agency/notifications")).json(),
    refetchInterval: 15000,
  });

  const subs = useQuery({
    queryKey: ["agency-subs"],
    queryFn: async (): Promise<SubResp> =>
      (await fetch("/api/agency/subscriptions")).json(),
  });

  const readAll = useMutation({
    mutationFn: async () => {
      await fetch("/api/agency/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "readAll" }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency-notifs"] });
      qc.invalidateQueries({ queryKey: ["agency-notif-count"] });
    },
  });

  const toggle = useMutation({
    mutationFn: async (slabs: SlabId[]) => {
      await fetch("/api/agency/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slabs }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agency-subs"] }),
  });

  const subscribed = subs.data?.subscribed ?? [];

  function onToggle(id: SlabId) {
    const next = subscribed.includes(id)
      ? subscribed.filter((s) => s !== id)
      : [...subscribed, id];
    // optimistic
    qc.setQueryData<SubResp>(["agency-subs"], (old) =>
      old ? { ...old, subscribed: next } : old,
    );
    toggle.mutate(next);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Feed */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-500">
              New leads in your subscribed slabs land here
            </p>
          </div>
          <button
            onClick={() => readAll.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        </div>

        <div className="space-y-2.5">
          {feed.isLoading ? (
            <div className="grid place-items-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (feed.data?.notifications.length ?? 0) === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-16 text-slate-400">
              <Bell className="h-7 w-7" />
              No notifications yet.
            </div>
          ) : (
            feed.data!.notifications.map((n) => <Row key={n.id} n={n} />)
          )}
        </div>
      </div>

      {/* Slab subscription card */}
      <aside>
        <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <BellRing className="h-4 w-4 text-indigo-500" /> Lead alerts
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Choose the budget slabs you want to be notified about. You&apos;ll
            only be alerted for new leads in these slabs.
          </p>

          <div className="mt-4 space-y-2">
            {(subs.data?.slabs ?? []).map((s) => {
              const on = subscribed.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => onToggle(s.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    on
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      {s.label}
                    </span>
                    <span className="block text-xs text-slate-400">
                      Unlock {formatINR(s.price)} / lead
                    </span>
                  </span>
                  <span
                    className={`grid h-5 w-9 place-items-center rounded-full p-0.5 transition-colors ${
                      on ? "bg-indigo-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        on ? "translate-x-2" : "-translate-x-1.5"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
            A traveler with a ₹7,500/head budget lands in the ₹5k–₹10k slab —
            only agencies subscribed to it get pinged.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Row({ n }: { n: Notif }) {
  const Icon = n.kind === "LEAD_PURCHASED" ? ShoppingBag : Ticket;
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        n.read ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50/50"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          n.read ? "bg-slate-100 text-slate-500" : "bg-indigo-100 text-indigo-600"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
          {!n.read && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
        </div>
        <p className="text-sm text-slate-500">{n.body}</p>
        <p className="mt-1 text-xs text-slate-400">{timeAgo(n.createdAtISO)}</p>
      </div>
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
