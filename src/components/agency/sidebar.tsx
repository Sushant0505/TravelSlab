"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutGrid,
  ShoppingBag,
  Receipt,
  Settings,
  LifeBuoy,
  Building2,
  Bell,
  ShieldCheck,
  UserCog,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionResp {
  session: { role: string; id: string; name: string; email: string } | null;
}

const NAV = [
  { label: "Marketplace", href: "/agencies", icon: LayoutGrid },
  { label: "Notifications", href: "/agencies/notifications", icon: Bell },
  { label: "My Purchases", href: "/agencies/purchases", icon: ShoppingBag },
  { label: "Invoices", href: "/agencies/purchases#invoices", icon: Receipt },
  { label: "Verification", href: "/agencies/kyc", icon: ShieldCheck },
  { label: "Profile Settings", href: "/agencies/profile", icon: UserCog },
];
const NAV_SECONDARY = [
  { label: "Settings", href: "/agencies/profile", icon: Settings },
  { label: "Support", href: "#", icon: LifeBuoy },
];

export function AgencySidebar() {
  const pathname = usePathname();

  // Show the actually-logged-in agency, not a hard-coded name.
  const { data } = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<SessionResp> =>
      (await fetch("/api/auth/session")).json(),
    staleTime: 60_000,
  });
  const agencyName = data?.session?.name?.trim() || "Agency";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 px-4 py-6 text-slate-300 lg:flex">
      <Link href="/agencies" className="mb-8 flex items-center gap-2 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-white">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">TripSlab</div>
          <div className="text-[11px] uppercase tracking-widest text-indigo-400">
            Agency Console
          </div>
        </div>
      </Link>

      <nav className="space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/agencies" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-500/15 text-white ring-1 ring-indigo-500/40"
                  : "hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-800 pt-4">
        {NAV_SECONDARY.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <div className="mt-3 rounded-xl bg-slate-800/60 p-3">
          <div className="text-xs text-slate-400">Signed in as</div>
          <div className="truncate text-sm font-semibold text-white">
            {agencyName}
          </div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Approved
          </div>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/agencies/login";
          }}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
