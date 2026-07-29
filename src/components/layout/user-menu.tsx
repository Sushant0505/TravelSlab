"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Luggage,
  Activity,
  Bell,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  User,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { Session } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Account {
  session: Session | null;
  unread: number;
}

const MENU: { label: string; href: string; icon: LucideIcon; notif?: boolean }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Trips", href: "/dashboard/trips", icon: Luggage },
  { label: "Lead Activity", href: "/dashboard/activity", icon: Activity },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, notif: true },
  { label: "Profile Settings", href: "/dashboard/profile", icon: Settings },
];

/** Shared session query — travelers only surface the account menu. */
export function useAccount() {
  return useQuery({
    queryKey: ["auth-session"],
    queryFn: async (): Promise<Account> => {
      const r = await fetch("/api/auth/session");
      if (!r.ok) return { session: null, unread: 0 };
      return r.json();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function initialsOf(name: string, email = ""): string {
  const src = name.trim() || email;
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/";
}

// ===========================================================================
// Desktop
// ===========================================================================

export function UserMenu() {
  const { data, isLoading } = useAccount();
  const qc = useQueryClient();

  // Avoid a flash of the wrong state before the session resolves.
  if (isLoading) return <div className="h-9 w-9" aria-hidden />;

  const session = data?.session ?? null;
  const unread = data?.unread ?? 0;

  // Agencies & admins keep their own dashboards — show a compact chip that
  // links back to the right console (never the traveler menu).
  if (session && session.role !== "TRAVELER") {
    return <AccountRoleMenu session={session} />;
  }

  // Logged out → a user icon that opens a Login / Sign Up panel.
  if (!session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent asChild align="end">
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <DropdownMenuLabel>
              <p className="text-sm font-semibold text-slate-900">Welcome to TripSlab</p>
              <p className="text-xs text-slate-500">Log in to track your trips & quotes</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4 text-slate-400" />
                Login
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/signup">
                <UserPlus className="h-4 w-4 text-slate-400" />
                Sign Up
              </Link>
            </DropdownMenuItem>

            <div className="p-1.5 pt-1">
              <Link
                href="/signup"
                className="block rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2.5 text-center text-sm font-bold text-white shadow-sm transition-transform hover:scale-[1.02]"
              >
                Create a free account
              </Link>
            </div>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const firstName = session.name.trim().split(/\s+/)[0] || "Account";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Account menu"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow">
            {initialsOf(session.name, session.email)}
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </span>
          <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-slate-800 md:inline">
            {firstName}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180 md:inline" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent asChild align="end">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <DropdownMenuLabel>
            <p className="text-sm font-semibold text-slate-900">{session.name}</p>
            <p className="truncate text-xs text-slate-500">{session.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {MENU.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href}>
                <item.icon className="h-4 w-4 text-slate-400" />
                <span className="flex-1">{item.label}</span>
                {item.notif && unread > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                    {unread}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
            onSelect={(e) => {
              e.preventDefault();
              qc.setQueryData(["auth-session"], { session: null, unread: 0 });
              doLogout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Compact chip for a signed-in agency/admin — links to their own console. */
function AccountRoleMenu({ session }: { session: Session }) {
  const isAdmin = session.role === "ADMIN";
  const dash = isAdmin ? "/admin" : "/agencies";
  const dashLabel = isAdmin ? "Admin console" : "Agency dashboard";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Account menu"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white shadow">
            {initialsOf(session.name, session.email)}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180 md:inline" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent asChild align="end">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <DropdownMenuLabel>
            <p className="text-sm font-semibold text-slate-900">{session.name}</p>
            <p className="truncate text-xs text-slate-500">{session.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {session.role}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={dash}>
              <LayoutDashboard className="h-4 w-4 text-slate-400" />
              {dashLabel}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
            onSelect={(e) => {
              e.preventDefault();
              doLogout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ===========================================================================
// Mobile (rendered inside the navbar drawer)
// ===========================================================================

export function UserMenuMobile({ onNavigate }: { onNavigate?: () => void }) {
  const { data, isLoading } = useAccount();
  if (isLoading) return null;

  const session = data?.session ?? null;

  if (session && session.role !== "TRAVELER") {
    const isAdmin = session.role === "ADMIN";
    return (
      <div className="mt-1 border-t border-slate-100 pt-4">
        <Link
          href={isAdmin ? "/admin" : "/agencies"}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LayoutDashboard className="h-4 w-4 text-slate-400" />
          {isAdmin ? "Admin console" : "Agency dashboard"}
        </Link>
        <button
          onClick={() => doLogout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mt-1 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        <Button asChild variant="outline" size="sm" onClick={onNavigate}>
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="gradient" size="sm" onClick={onNavigate}>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const unread = data?.unread ?? 0;

  return (
    <div className="mt-1 border-t border-slate-100 pt-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
          {initialsOf(session.name, session.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
          <p className="truncate text-xs text-slate-500">{session.email}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <LayoutDashboard className="h-4 w-4 text-slate-400" /> Dashboard
        </Link>
        <Link href="/dashboard/trips" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Luggage className="h-4 w-4 text-slate-400" /> My Trips
        </Link>
        <Link href="/dashboard/notifications" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <Bell className="h-4 w-4 text-slate-400" /> Notifications
          {unread > 0 && (
            <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">
              {unread}
            </span>
          )}
        </Link>
        <button
          onClick={() => doLogout()}
          className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}
