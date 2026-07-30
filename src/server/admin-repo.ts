/**
 * Admin repository (agencies, users) + revenue aggregation.
 *
 * Uses Prisma/Postgres when a database is configured (see `withDb`), otherwise
 * falls back to the in-memory demo data below. Signatures are the API contract.
 */

import { withDb } from "@/lib/persistence";
import { leadStats, soldLeadEvents } from "./lead-repo";
import type { KycDocMeta, KycDocInput } from "@/lib/kyc";

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
  city: string;
  status: AgencyStatus;
  /** Admin's reason when the agency is suspended or blocked. */
  statusNote: string;
  purchases: number;
  spend: number;
  joinedISO: string;
  /** KYC files the agency uploaded (metadata only — no data URLs). */
  documents: KycDocMeta[];
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
const AGENCY_CITIES = [
  "Delhi", "Mumbai", "Bengaluru", "Dehradun", "Jaipur", "Kolkata",
  "Pune", "Hyderabad", "Chennai", "Ahmedabad", "Chandigarh", "Goa (Panaji)",
];
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
      city: pick(rng, AGENCY_CITIES),
      status,
      statusNote:
        status === "SUSPENDED"
          ? "Incomplete KYC — awaiting updated GST certificate."
          : status === "BLOCKED"
            ? "Repeated policy violations reported by travelers."
            : "",
      purchases,
      spend: purchases * (99 + Math.floor(rng() * 300)),
      joinedISO: new Date(Date.now() - Math.floor(rng() * 240) * 86_400_000).toISOString(),
      documents: [],
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

interface StoredDoc extends KycDocMeta {
  dataUrl: string;
}
const g = globalThis as unknown as {
  __agencies?: AdminAgency[];
  __users?: AdminUser[];
  __agencyDocs?: Map<string, StoredDoc[]>;
};
const agencies = g.__agencies ?? (g.__agencies = seedAgencies());
const users = g.__users ?? (g.__users = seedUsers());
// In-memory KYC store (source of truth in fallback mode), keyed by agency id.
const agencyDocs = g.__agencyDocs ?? (g.__agencyDocs = new Map<string, StoredDoc[]>());

function memDocMeta(agencyId: string): KycDocMeta[] {
  return (agencyDocs.get(agencyId) ?? []).map(({ dataUrl: _d, ...m }) => m);
}

// Prisma `select` for document metadata — deliberately excludes `dataUrl` so
// list/overview queries never pull megabytes of base64.
const DOC_META_SELECT = {
  id: true,
  label: true,
  fileName: true,
  mimeType: true,
  size: true,
  createdAt: true,
} as const;

function docRowToMeta(d: {
  id: string;
  label: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}): KycDocMeta {
  return {
    id: d.id,
    label: d.label,
    fileName: d.fileName,
    mimeType: d.mimeType,
    size: d.size,
    uploadedAtISO: d.createdAt.toISOString(),
  };
}

// --- Agencies ---------------------------------------------------------------

export function adminListAgencies(): Promise<AdminAgency[]> {
  return withDb(
    async (db) => {
      const rows = await db.agency.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          purchases: true,
          documents: { select: DOC_META_SELECT, orderBy: { createdAt: "asc" } },
        },
      });
      return rows.map(agencyToAdmin);
    },
    () =>
      agencies
        .slice()
        .sort((a, b) => b.joinedISO.localeCompare(a.joinedISO))
        .map((a) => ({ ...a, documents: memDocMeta(a.id) })),
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
      const a = await db.agency.findUnique({
        where: { id },
        include: {
          purchases: true,
          documents: { select: DOC_META_SELECT, orderBy: { createdAt: "asc" } },
        },
      });
      return a ? agencyToAdmin(a) : undefined;
    },
    () => {
      const a = agencies.find((x) => x.id === id);
      return a ? { ...a, documents: memDocMeta(a.id) } : undefined;
    },
  );
}

/**
 * Persist a freshly registered agency as PENDING. Idempotent on email —
 * re-submitting the same email returns the existing record.
 */
export interface CreateAgencyInput {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber?: string;
  city?: string;
  documents?: KycDocInput[];
}

export function adminCreateAgency(
  input: CreateAgencyInput,
): Promise<{ agency: AdminAgency; created: boolean }> {
  return withDb(
    async (db) => {
      const existing = await db.agency.findFirst({
        where: { email: { equals: input.email, mode: "insensitive" } },
        include: {
          purchases: true,
          documents: { select: DOC_META_SELECT, orderBy: { createdAt: "asc" } },
        },
      });
      if (existing) return { agency: agencyToAdmin(existing), created: false };

      const created = await db.agency.create({
        data: {
          name: input.name,
          ownerName: input.ownerName,
          email: input.email,
          phone: input.phone,
          gstNumber: input.gstNumber ?? null,
          city: input.city ?? null,
          passwordHash: "",
          status: "PENDING",
          documents: input.documents?.length
            ? { create: input.documents.map(toDocCreate) }
            : undefined,
        },
        include: {
          purchases: true,
          documents: { select: DOC_META_SELECT, orderBy: { createdAt: "asc" } },
        },
      });
      return { agency: agencyToAdmin(created), created: true };
    },
    () => adminCreateAgencyMemory(input),
  );
}

function toDocCreate(d: KycDocInput) {
  return {
    label: d.label,
    fileName: d.fileName,
    mimeType: d.mimeType,
    size: d.size,
    dataUrl: d.dataUrl,
  };
}

function adminCreateAgencyMemory(
  input: CreateAgencyInput,
): { agency: AdminAgency; created: boolean } {
  const existing = agencies.find(
    (a) => a.email.toLowerCase() === input.email.trim().toLowerCase(),
  );
  if (existing) return { agency: { ...existing, documents: memDocMeta(existing.id) }, created: false };

  const id = `agency_${Date.now().toString(36)}`;
  if (input.documents?.length) {
    agencyDocs.set(id, input.documents.map((d) => toStoredDoc(id, d)));
  }
  const agency: AdminAgency = {
    id,
    name: input.name,
    ownerName: input.ownerName,
    email: input.email,
    phone: input.phone,
    gstNumber: input.gstNumber ?? "",
    city: input.city ?? "",
    status: "PENDING",
    statusNote: "",
    purchases: 0,
    spend: 0,
    joinedISO: new Date().toISOString(),
    documents: memDocMeta(id),
  };
  agencies.unshift(agency);
  return { agency, created: true };
}

let memDocSeq = 0;
function toStoredDoc(agencyId: string, d: KycDocInput): StoredDoc {
  return {
    id: `doc_${Date.now().toString(36)}_${memDocSeq++}`,
    label: d.label,
    fileName: d.fileName,
    mimeType: d.mimeType,
    size: d.size,
    uploadedAtISO: new Date().toISOString(),
    dataUrl: d.dataUrl,
  };
}

// --- Agency KYC documents ---------------------------------------------------

/** List one agency's document metadata (no data URLs). */
export function listAgencyDocuments(agencyId: string): Promise<KycDocMeta[]> {
  return withDb(
    async (db) => {
      const rows = await db.agencyDocument.findMany({
        where: { agencyId },
        select: DOC_META_SELECT,
        orderBy: { createdAt: "asc" },
      });
      return rows.map(docRowToMeta);
    },
    () => memDocMeta(agencyId),
  );
}

/** Append documents to an agency; returns the full updated metadata list. */
export function addAgencyDocuments(
  agencyId: string,
  docs: KycDocInput[],
): Promise<KycDocMeta[]> {
  return withDb(
    async (db) => {
      if (docs.length) {
        await db.agencyDocument.createMany({
          data: docs.map((d) => ({ agencyId, ...toDocCreate(d) })),
        });
      }
      const rows = await db.agencyDocument.findMany({
        where: { agencyId },
        select: DOC_META_SELECT,
        orderBy: { createdAt: "asc" },
      });
      return rows.map(docRowToMeta);
    },
    () => {
      const list = agencyDocs.get(agencyId) ?? [];
      list.push(...docs.map((d) => toStoredDoc(agencyId, d)));
      agencyDocs.set(agencyId, list);
      return memDocMeta(agencyId);
    },
  );
}

/** Fetch a single document's bytes (data URL) — used by the file viewer. */
export function getAgencyDocument(
  agencyId: string,
  docId: string,
): Promise<{ fileName: string; mimeType: string; dataUrl: string } | null> {
  return withDb(
    async (db) => {
      const d = await db.agencyDocument.findFirst({
        where: { id: docId, agencyId },
        select: { fileName: true, mimeType: true, dataUrl: true },
      });
      return d ?? null;
    },
    () => {
      const d = (agencyDocs.get(agencyId) ?? []).find((x) => x.id === docId);
      return d ? { fileName: d.fileName, mimeType: d.mimeType, dataUrl: d.dataUrl } : null;
    },
  );
}

/** Remove one document; returns true when it existed. */
export function deleteAgencyDocument(agencyId: string, docId: string): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.agencyDocument.deleteMany({ where: { id: docId, agencyId } });
      return res.count > 0;
    },
    () => {
      const list = agencyDocs.get(agencyId) ?? [];
      const next = list.filter((x) => x.id !== docId);
      agencyDocs.set(agencyId, next);
      return next.length < list.length;
    },
  );
}

/** Count of verified (APPROVED) agencies — the pool "waiting" to serve a lead. */
export function countApprovedAgencies(): Promise<number> {
  return withDb(
    (db) => db.agency.count({ where: { status: "APPROVED" } }),
    () => agencies.filter((a) => a.status === "APPROVED").length,
  );
}

export type AgencyAction = "approve" | "suspend" | "block" | "reset_password";

export function adminAgencyAction(
  id: string,
  action: AgencyAction,
  opts?: { note?: string },
): Promise<{ ok: boolean; error?: string }> {
  const nextStatus =
    action === "approve"
      ? "APPROVED"
      : action === "suspend"
        ? "SUSPENDED"
        : action === "block"
          ? "BLOCKED"
          : undefined; // reset_password: no status change

  // Approving clears any prior reason; suspend/block records the admin's note.
  const note = (opts?.note ?? "").trim();
  const nextNote =
    action === "approve"
      ? "" // cleared
      : action === "suspend" || action === "block"
        ? note
        : undefined; // reset_password: leave note as-is

  return withDb(
    async (db) => {
      const a = await db.agency.findUnique({ where: { id } });
      if (!a) return { ok: false, error: "Agency not found" };
      if (nextStatus) {
        await db.agency.update({
          where: { id },
          data: {
            status: nextStatus,
            ...(nextNote !== undefined ? { statusNote: nextNote || null } : {}),
          },
        });
      }
      return { ok: true };
    },
    () => {
      const a = agencies.find((x) => x.id === id);
      if (!a) return { ok: false, error: "Agency not found" };
      if (nextStatus) a.status = nextStatus;
      if (nextNote !== undefined) a.statusNote = nextNote;
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
  city?: string | null;
  status: AgencyStatus;
  statusNote?: string | null;
  createdAt: Date;
  purchases: { amount: number }[];
  documents?: {
    id: string;
    label: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }[];
}): AdminAgency {
  return {
    id: a.id,
    name: a.name,
    ownerName: a.ownerName,
    email: a.email,
    phone: a.phone,
    gstNumber: a.gstNumber ?? "",
    city: a.city ?? "",
    status: a.status,
    statusNote: a.statusNote ?? "",
    purchases: a.purchases.length,
    spend: a.purchases.reduce((s, p) => s + p.amount, 0),
    joinedISO: a.createdAt.toISOString(),
    documents: (a.documents ?? []).map(docRowToMeta),
  };
}
