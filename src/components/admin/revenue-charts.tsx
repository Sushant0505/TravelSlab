"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { AdminCard, PageHeading } from "./ui";
import { formatINR, formatCompact } from "@/lib/utils";
import type { RevenuePoint } from "@/server/admin-repo";

interface RevenueData {
  daily: RevenuePoint[];
  monthly: RevenuePoint[];
  topAgencies: RevenuePoint[];
}

const AXIS = { fill: "#71717a", fontSize: 11 };
const TOOLTIP = {
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: 12,
  color: "#fff",
};
const BAR_COLORS = ["#a855f7", "#8b5cf6", "#7c3aed", "#c026d3", "#d946ef", "#e879f9"];

export function RevenueCharts() {
  const { data } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: async (): Promise<RevenueData> => {
      const r = await fetch("/api/admin/revenue");
      return r.json();
    },
  });

  if (!data) {
    return (
      <div className="grid place-items-center py-24 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totalRev = data.daily.reduce((s, p) => s + p.revenue, 0);
  const totalLeads = data.daily.reduce((s, p) => s + p.leads, 0);

  return (
    <div>
      <PageHeading
        title="Revenue Analytics"
        subtitle="Lead sales and agency spend"
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Kpi label="30-day revenue" value={formatINR(totalRev)} />
        <Kpi label="Leads sold (30d)" value={String(totalLeads)} />
        <Kpi
          label="Avg / lead"
          value={totalLeads ? formatINR(Math.round(totalRev / totalLeads)) : "—"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-white">Daily revenue</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} interval={4} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} width={44} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: number) => [formatINR(v), "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#c084fc" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="mb-4 font-semibold text-white">Monthly revenue</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} width={44} />
                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "#27272a" }} formatter={(v: number) => [formatINR(v), "Revenue"]} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {data.monthly.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="mb-4 font-semibold text-white">Lead sales (daily)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily}>
                <CartesianGrid stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} interval={4} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: number) => [v, "Leads"]} />
                <Line type="monotone" dataKey="leads" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-white">Top agencies by spend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topAgencies} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={130} />
                <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "#27272a" }} formatter={(v: number) => [formatINR(v), "Spend"]} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                  {data.topAgencies.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <AdminCard className="p-5">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </AdminCard>
  );
}
