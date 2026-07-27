"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Bell, ShieldAlert } from "lucide-react";

export function AdminTopbar() {
  const { data } = useQuery({
    queryKey: ["admin-notif-count"],
    queryFn: async (): Promise<{ unread: number }> =>
      (await fetch("/api/admin/notifications")).json(),
    refetchInterval: 15000,
  });
  const unread = data?.unread ?? 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-2 lg:hidden">
        <ShieldAlert className="h-5 w-5 text-violet-400" />
        <span className="font-bold text-white">TripSlab Admin</span>
      </div>

      <div className="hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 md:flex md:w-80">
        <Search className="h-4 w-4" />
        <input
          placeholder="Search leads, agencies, users…"
          className="w-full bg-transparent outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/notifications"
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
