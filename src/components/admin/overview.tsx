"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Ticket,
  IndianRupee,
  Building2,
  PauseCircle,
  UserX,
  TrendingUp,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import { AdminCard, PageHeading } from "./ui";
import { formatINR, formatCompact } from "@/lib/utils";
import type { Overview } from "@/server/admin-repo";
import type { RevenuePoint } from "@/server/admin-repo";

export function AdminOverview() {
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async (): Promise<{ overview: Overview }> => {
      const r = await fetch("/api/admin/overview");
      return r.json();
    },
  });
  const revenue = useQuery({
    queryKey: ["admin-revenue-mini"],
    queryFn: async (): Promise<{ daily: RevenuePoint[] }> => {
      const r = await fetch("/api/admin/revenue");
      return r.json();
    },
  });

  const o = overview.data?.overview;

  if (!o) {
    return (
      <div className="grid place-items-center py-24 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Total leads", value: String(o.totalLeads), icon: Ticket, tone: "text-sky-300" },
    { label: "Revenue", value: formatINR(o.revenue), icon: IndianRupee, tone: "text-emerald-300" },
    { label: "Active agencies", value: String(o.activeAgencies), icon: Building2, tone: "text-violet-300" },
    { label: "Suspended agencies", value: String(o.suspendedAgencies), icon: PauseCircle, tone: "text-orange-300" },
    { label: "Blocked users", value: String(o.blockedUsers), icon: UserX, tone: "text-rose-300" },
    { label: "Conversion rate", value: `${(o.conversionRate * 100).toFixed(1)}%`, icon: TrendingUp, tone: "text-fuchsia-300" },
  ];

  return (
    <div>
      <PageHeading
        title="Overview"
        subtitle="Marketplace health at a glance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <AdminCard key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-xl bg-zinc-800 ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{c.value}</div>
            <div className="text-sm text-zinc-400">{c.label}</div>
          </AdminCard>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <AdminCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Revenue · last 30 days</h3>
              <p className="text-sm text-zinc-500">
                {formatINR(
                  (revenue.data?.daily ?? []).reduce((s, p) => s + p.revenue, 0),
                )}{" "}
                collected
              </p>
            </div>
            <Link
              href="/admin/revenue"
              className="inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200"
            >
              Details <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue.data?.daily ?? []}>
                <defs>
                  <linearGradient id="ov" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  interval={5}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: 12,
                    color: "#fff",
                  }}
                  formatter={(v: number) => [formatINR(v), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#c084fc"
                  strokeWidth={2}
                  fill="url(#ov)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="font-semibold text-white">Lead funnel</h3>
          <div className="mt-4 space-y-4">
            <Funnel label="Total leads" value={o.totalLeads} max={o.totalLeads} tone="bg-sky-500" />
            <Funnel label="Sold" value={o.soldLeads} max={o.totalLeads} tone="bg-violet-500" />
            <Funnel
              label="Pending agencies"
              value={o.pendingAgencies}
              max={Math.max(o.activeAgencies + o.pendingAgencies, 1)}
              tone="bg-amber-500"
            />
          </div>
          <div className="mt-6 rounded-xl bg-zinc-800/60 p-3 text-sm text-zinc-400">
            Avg revenue / sold lead:{" "}
            <span className="font-semibold text-white">
              {o.soldLeads ? formatINR(Math.round(o.revenue / o.soldLeads)) : "—"}
            </span>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function Funnel({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-zinc-400">{label}</span>
        <span className="font-semibold text-white">{formatCompact(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
