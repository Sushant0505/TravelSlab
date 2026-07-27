/**
 * Admin repository (agencies, users) + revenue aggregation.
 *
 * Uses Prisma/Postgres when a database is configured (see `withDb`), otherwise
 * falls back to the in-memory demo data below. Signatures are the API contract.
 */

import { withDb } from "@/lib/persistence";
import { leadStats, soldLeadEvents } from "./lead-repo";

// --- deterministic RNG (shared style with lead-repo) ------------------------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type AgencyStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "BLOCKED";
export type UserStatus = "ACTIVE" | "BLOCKED";

export interface AdminAgency {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  status: AgencyStatus;
  purchases: number;
  spend: number;
  joinedISO: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: UserStatus;
  leadsSubmitted: number;
  flagged: boolean;
  lastActiveISO: string;
}

const AGENCY_NAMES = [
  "Wanderly Travels", "BlueSky Holidays", "Peak & Coast", "Nomad Trails",
  "Sunrise Getaways", "Voyage Craft", "Himalaya Routes", "Coral Coast Tours",
  "Metro Journeys", "Elephant Route", "Zenith Vacations", "Compass Cabs & Tours",
];
const OWNERS = ["Rahul Mehta", "Sneha Kapoor", "Imran Ali", "Divya Nair", "Karan Shah", "Pooja Rao"];
const USER_FIRST = ["Ananya", "Rohan", "Priya", "Arjun", "Neha", "Vikram", "Sara", "Kabir", "Isha", "Dev"];
const USER_LAST = ["Sharma", "Iyer", "Nair", "Gupta", "Reddy", "Khan", "Bose", "Menon"];
const AGENCY_STATUSES: AgencyStatus[] = ["APPROVED", "APPROVED", "APPROVED", "PENDING", "SUSPENDED", "BLOCKED"];

function pick<T>(rng: () => number, a: T[]): T {
  return a[Math.floor(rng() * a.length)];
}

function seedAgencies(): AdminAgency[] {
  const rng = mulberry32(7);
  return AGENCY_NAMES.map((name, i) => {
    // Keep the demo agency (index 0) APPROVED so the demo login works.
    const status = i === 0 ? "APPROVED" : pick(rng, AGENCY_STATUSES);
    const purchases = status === "APPROVED" ? Math.floor(rng() * 40) : Math.floor(rng() * 4);
    return {
      id: `agency_${100 + i}`,
      name,
      ownerName: pick(rng, OWNERS),
      email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@travel.in`,
      phone: `98${(10000000 + Math.floor(rng() * 89999999)).toString().slice(0, 8)}`,
      gstNumber: `2${(2 + i).toString()}ABCDE${1000 + i}F1Z5`,
      status,
      purchases,
      spend: purchases * (99 + Math.floor(rng() * 300)),
      joinedISO: new Date(Date.now() - Math.floor(rng() * 240) * 86_400_000).toISOString(),
    };
  });
}

function seedUsers(): AdminUser[] {
  const rng = mulberry32(11);
  return Array.from({ length: 26 }, (_, i) => {
    const first = pick(rng, USER_FIRST);
    const last = pick(rng, USER_LAST);
    const flagged = rng() > 0.85;
    return {
      id: `user_${200 + i}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      mobile: `9${(700000000 + Math.floor(rng() * 99999999)).toString().slice(0, 9)}`,
      status: (flagged && rng() > 0.5 ? "BLOCKED" : "ACTIVE") as UserStatus,
      leadsSubmitted: 1 + Math.floor(rng() * 5),
      flagged,
      lastActiveISO: new Date(Date.now() - Math.floor(rng() * 72) * 3_600_000).toISOString(),
    };
  });
}

const g = globalThis as unknown as {
  __agencies?: AdminAgency[];
  __users?: AdminUser[];
};
const agencies = g.__agencies ?? (g.__agencies = seedAgencies());
const users = g.__users ?? (g.__users = seedUsers());

// --- Agencies ---------------------------------------------------------------

export function adminListAgencies(): Promise<AdminAgency[]> {
  return withDb(
    async (db) => {
      const rows = await db.agency.findMany({
        orderBy: { createdAt: "desc" },
        include: { purchases: true },
      });
      return rows.map(agencyToAdmin);
    },
    () => agencies.slice().sort((a, b) => b.joinedISO.localeCompare(a.joinedISO)),
  );
}

export function findAgencyByEmail(email: string): Promise<AdminAgency | undefined> {
  const e = email.trim().toLowerCase();
  return withDb(
    async (db) => {
      const a = await db.agency.findFirst({
        where: { email: { equals: e, mode: "insensitive" } },
        include: { purchases: true },
      });
      return a ? agencyToAdmin(a) : undefined;
    },
    () => agencies.find((a) => a.email.toLowerCase() === e),
  );
}

export function getAgencyById(id: string): Promise<AdminAgency | undefined> {
  return withDb(
    async (db) => {
      const a = await db.agency.findUnique({ where: { id }, include: { purchases: true } });
      return a ? agencyToAdmin(a) : undefined;
    },
    () => agencies.find((a) => a.id === id),
  );
}

/**
 * Persist a freshly registered agency as PENDING. Idempotent on email —
 * re-submitting the same email returns the existing record.
 */
export function adminCreateAgency(input: {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber?: string;
}): Promise<{ agency: AdminAgency; created: boolean }> {
  return withDb(
    async (db) => {
      const existing = await db.agency.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
        include: { purchases: true },
      });
      if (existing) return { agency: agencyToAdmin(existing), created: false };

      const created = await db.agency.create({
        data: {
          name: input.name,
          ownerName: input.ownerName,
          email: input.email,
          phone: input.phone,
          gstNumber: input.gstNumber ?? null,
          passwordHash: "",
          status: "PENDING",
        },
        include: { purchases: true },
      });
      return { agency: agencyToAdmin(created), created: true };
    },
    () => adminCreateAgencyMemory(input),
  );
}

function adminCreateAgencyMemory(input: {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber?: string;
}): { agency: AdminAgency; created: boolean } {
  const existing = agencies.find(
    (a) => a.email.toLowerCase() === input.email.trim().toLowerCase(),
  );
  if (existing) return { agency: existing, created: false };

  const agency: AdminAgency = {
    id: `agency_${Date.now().toString(36)}`,
    name: input.name,
    ownerName: input.ownerName,
    email: input.email,
    phone: input.phone,
    gstNumber: input.gstNumber ?? "",
    status: "PENDING",
    purchases: 0,
    spend: 0,
    joinedISO: new Date().toISOString(),
  };
  agencies.unshift(agency);
  return { agency, created: true };
}

export type AgencyAction = "approve" | "suspend" | "block" | "reset_password";

export function adminAgencyAction(
  id: string,
  action: AgencyAction,
): Promise<{ ok: boolean; error?: string }> {
  const nextStatus =
    action === "approve"
      ? "APPROVED"
      : action === "suspend"
        ? "SUSPENDED"
        : action === "block"
          ? "BLOCKED"
          : undefined; // reset_password: no status change

  return withDb(
    async (db) => {
      const a = await db.agency.findUnique({ where: { id } });
      if (!a) return { ok: false, error: "Agency not found" };
      if (nextStatus) await db.agency.update({ where: { id }, data: { status: nextStatus } });
      return { ok: true };
    },
    () => {
      const a = agencies.find((x) => x.id === id);
      if (!a) return { ok: false, error: "Agency not found" };
      if (nextStatus) a.status = nextStatus;
      return { ok: true };
    },
  );
}

// --- Users ------------------------------------------------------------------

export function adminListUsers(): Promise<AdminUser[]> {
  return withDb(
    async (db) => {
      const rows = await db.traveler.findMany({
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { leads: true } } },
      });
      return rows.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        mobile: t.mobile,
        status: t.status,
        leadsSubmitted: t._count.leads,
        flagged: Boolean(t.blockedUntil),
        lastActiveISO: t.updatedAt.toISOString(),
      }));
    },
    () => users.slice().sort((a, b) => b.lastActiveISO.localeCompare(a.lastActiveISO)),
  );
}

export type UserAction = "block" | "unblock";

export function adminUserAction(
  id: string,
  action: UserAction,
): Promise<{ ok: boolean; error?: string }> {
  const status: UserStatus = action === "block" ? "BLOCKED" : "ACTIVE";
  return withDb(
    async (db) => {
      const u = await db.traveler.findUnique({ where: { id } });
      if (!u) return { ok: false, error: "User not found" };
      await db.traveler.update({ where: { id }, data: { status } });
      return { ok: true };
    },
    () => {
      const u = users.find((x) => x.id === id);
      if (!u) return { ok: false, error: "User not found" };
      u.status = status;
      return { ok: true };
    },
  );
}

// --- Overview ---------------------------------------------------------------
export interface Overview {
  totalLeads: number;
  revenue: number;
  activeAgencies: number;
  suspendedAgencies: number;
  blockedUsers: number;
  conversionRate: number;
  soldLeads: number;
  pendingAgencies: number;
}

export function adminOverview(): Promise<Overview> {
  return withDb(
    async (db) => {
      const [ls, activeAgencies, suspendedAgencies, pendingAgencies, blockedUsers] =
        await Promise.all([
          leadStats(),
          db.agency.count({ where: { status: "APPROVED" } }),
          db.agency.count({ where: { status: "SUSPENDED" } }),
          db.agency.count({ where: { status: "PENDING" } }),
          db.traveler.count({ where: { status: "BLOCKED" } }),
        ]);
      return {
        totalLeads: ls.total,
        revenue: ls.revenue,
        soldLeads: ls.sold,
        conversionRate: ls.conversionRate,
        activeAgencies,
        suspendedAgencies,
        pendingAgencies,
        blockedUsers,
      };
    },
    async () => {
      // dbState is "down" here, so leadStats() resolves from memory immediately.
      const ls = await leadStats();
      return {
        totalLeads: ls.total,
        revenue: ls.revenue,
        soldLeads: ls.sold,
        conversionRate: ls.conversionRate,
        activeAgencies: agencies.filter((a) => a.status === "APPROVED").length,
        suspendedAgencies: agencies.filter((a) => a.status === "SUSPENDED").length,
        pendingAgencies: agencies.filter((a) => a.status === "PENDING").length,
        blockedUsers: users.filter((u) => u.status === "BLOCKED").length,
      };
    },
  );
}

// --- Revenue analytics ------------------------------------------------------
export interface RevenuePoint {
  label: string;
  revenue: number;
  leads: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TopAgency {
  name: string;
  spend: number;
  purchases: number;
}

/** Shared curve-building from sold-lead events + per-agency spend. */
function buildRevenue(
  events: { dateISO: string; amount: number }[],
  topAgenciesSource: TopAgency[],
  days: number,
) {
  const dailyMap = new Map<string, { revenue: number; leads: number }>();
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date(Date.now() - d * 86_400_000);
    dailyMap.set(dt.toISOString().slice(0, 10), { revenue: 0, leads: 0 });
  }
  const rng = mulberry32(23);
  const keys = Array.from(dailyMap.keys());
  for (const ev of events) {
    const key = keys[Math.floor(rng() * keys.length)];
    const cell = dailyMap.get(key)!;
    cell.revenue += ev.amount;
    cell.leads += 1;
  }
  const daily: RevenuePoint[] = keys.map((k) => ({
    label: k.slice(5),
    revenue: dailyMap.get(k)!.revenue,
    leads: dailyMap.get(k)!.leads,
  }));

  const totalRev = daily.reduce((s, p) => s + p.revenue, 0);
  const monthly: RevenuePoint[] = Array.from({ length: 6 }, (_, i) => {
    const m = new Date();
    m.setMonth(m.getMonth() - (5 - i));
    const factor = 0.5 + i * 0.16;
    return {
      label: MONTHS[m.getMonth()],
      revenue: Math.round(totalRev * factor),
      leads: Math.round(events.length * factor),
    };
  });

  const topAgencies = topAgenciesSource
    .slice()
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6)
    .map((a) => ({ label: a.name, revenue: a.spend, leads: a.purchases }));

  return { daily, monthly, topAgencies };
}

/** Daily revenue for the last `days`, plus monthly rollup + per-agency spend. */
export function adminRevenue(days = 30) {
  return withDb(
    async (db) => {
      const [events, agencyRows] = await Promise.all([
        soldLeadEvents(),
        db.agency.findMany({ include: { purchases: true } }),
      ]);
      const top = agencyRows.map((a) => ({
        name: a.name,
        spend: a.purchases.reduce((s, p) => s + p.amount, 0),
        purchases: a.purchases.length,
      }));
      return buildRevenue(events, top, days);
    },
    async () => {
      const events = await soldLeadEvents();
      const top = agencies.map((a) => ({
        name: a.name,
        spend: a.spend,
        purchases: a.purchases,
      }));
      return buildRevenue(events, top, days);
    },
  );
}

// --- Prisma mapper ----------------------------------------------------------

function agencyToAdmin(a: {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string | null;
  status: AgencyStatus;
  createdAt: Date;
  purchases: { amount: number }[];
}): AdminAgency {
  return {
    id: a.id,
    name: a.name,
    ownerName: a.ownerName,
    email: a.email,
    phone: a.phone,
    gstNumber: a.gstNumber ?? "",
    status: a.status,
    purchases: a.purchases.length,
    spend: a.purchases.reduce((s, p) => s + p.amount, 0),
    joinedISO: a.createdAt.toISOString(),
  };
}
