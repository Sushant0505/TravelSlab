"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Luggage,
  Activity,
  Bell,
  Settings,
  LogOut,
  Plane,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAccount, initialsOf } from "@/components/layout/user-menu";

const NAV: { label: string; short: string; href: string; icon: LucideIcon; notif?: boolean }[] = [
  { label: "Overview", short: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Trips", short: "Trips", href: "/dashboard/trips", icon: Luggage },
  { label: "Lead Activity", short: "Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Notifications", short: "Alerts", href: "/dashboard/notifications", icon: Bell, notif: true },
  { label: "Profile Settings", short: "Profile", href: "/dashboard/profile", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

export function DashboardTopbar() {
  const { data } = useAccount();
  const session = data?.session;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
            <Plane className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold text-slate-900">
            Trip<span className="text-gradient">Slab</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/plan"
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 sm:inline-flex"
          >
            <Plus className="h-4 w-4" /> Plan a trip
          </Link>
          {session && (
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                {initialsOf(session.name, session.email)}
              </span>
              <button
                onClick={logout}
                title="Logout"
                className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data } = useAccount();
  const unread = data?.unread ?? 0;

  return (
    <aside className="sticky top-20 hidden h-fit w-56 shrink-0 lg:block">
      <nav className="space-y-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.notif && unread > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600"
      >
        <LogOut className="h-5 w-5" /> Logout
      </button>
    </aside>
  );
}

export function DashboardMobileTabs() {
  const pathname = usePathname();
  const { data } = useAccount();
  const unread = data?.unread ?? 0;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
              active ? "text-primary" : "text-slate-500",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.short}
            {item.notif && unread > 0 && (
              <span className="absolute right-1/4 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
