"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  LineChart,
  ShieldAlert,
  Bell,
  Images,
  IndianRupee,
  MapPin,
  Package,
  Tag,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Ticket },
  { label: "Destinations", href: "/admin/destinations", icon: MapPin },
  { label: "Packages", href: "/admin/packages", icon: Package },
  { label: "Trip Types", href: "/admin/trip-types", icon: Tag },
  { label: "Agencies", href: "/admin/agencies", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Pricing", href: "/admin/pricing", icon: IndianRupee },
  { label: "Revenue", href: "/admin/revenue", icon: LineChart },
  { label: "Banners", href: "/admin/banners", icon: Images },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-6 lg:flex">
      <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">TripSlab</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-violet-400">
            Admin
          </div>
        </div>
      </Link>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-white ring-1 ring-violet-500/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-800 pt-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-zinc-800 text-sm font-bold text-white">
            A
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">
              Admin
            </div>
            <div className="truncate text-xs text-zinc-500">
              admin@tripslab.in
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/admin/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
