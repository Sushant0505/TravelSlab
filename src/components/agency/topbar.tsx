"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Bell, ShoppingBag } from "lucide-react";
import { useAgency } from "@/store/agency";
import { formatINR } from "@/lib/utils";

export function AgencyTopbar() {
  const wallet = useAgency((s) => s.walletBalance);
  const purchases = useAgency((s) => s.purchases.length);

  const { data } = useQuery({
    queryKey: ["agency-notif-count"],
    queryFn: async (): Promise<{ unread: number }> =>
      (await fetch("/api/agency/notifications")).json(),
    refetchInterval: 15000,
  });
  const unread = data?.unread ?? 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3.5 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Lead Marketplace</h1>
        <p className="text-xs text-slate-500">
          Buy verified, budget-tagged travel leads
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/agencies/purchases"
          className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex"
        >
          <ShoppingBag className="h-4 w-4 text-indigo-500" />
          {purchases} bought
        </Link>
        <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-700">
          <Wallet className="h-4 w-4" />
          {formatINR(wallet)}
        </div>
        <Link
          href="/agencies/notifications"
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
