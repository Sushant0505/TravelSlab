/**
 * Lead repository for the agency marketplace.
 *
 * Marketplace model is NON-EXCLUSIVE: a lead can be unlocked (purchased) by
 * many agencies independently — each pays the slab price and gets the contact.
 * A lead is therefore never globally "sold"; "owned" is always relative to the
 * requesting agency.
 *
 * Each function uses Prisma/Postgres when a database is configured (see
 * `withDb`), and otherwise falls back to the in-memory demo data below.
 */

import { assignSlab, getSlab, type SlabId } from "@/lib/slabs";
import { withDb } from "@/lib/persistence";
import {
  toMarketplaceLead,
  revealContact,
  type FullLead,
  type MarketplaceLead,
  type RevealedContact,
} from "@/lib/masking";
import type { Lead, Traveler } from "@prisma/client";

// ===========================================================================
// In-memory demo data (fallback when no database is configured)
// ===========================================================================

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Ananya", "Rohan", "Priya", "Arjun", "Neha", "Vikram", "Sara", "Kabir", "Isha", "Dev", "Meera", "Aditya"];
const LAST = ["Sharma", "Iyer", "Nair", "Gupta", "Reddy", "Khan", "Bose", "Menon", "Rao", "Verma"];
const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"];
const DESTS = ["Goa", "Bali", "Dubai", "Thailand", "Kashmir", "Leh Ladakh", "Andaman", "Kerala", "Vietnam", "Meghalaya", "Arunachal Pradesh"];
const TYPES = ["Backpacking", "Family", "Honeymoon", "Group / Friends", "Solo", "Luxury"];
const PREF_BITS = [
  "sea-facing stay", "vegetarian meals", "moderate trekking", "no red-eye flights",
  "budget hotels are fine", "need a local guide", "photography-focused",
  "kid-friendly activities", "adventure sports", "spa & wellness",
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function budgetRangeFor(slab: SlabId): string {
  return getSlab(slab).label;
}

function generate(count: number): FullLead[] {
  const rng = mulberry32(42);
  const out: FullLead[] = [];
  for (let i = 0; i < count; i++) {
    const travelers = 1 + Math.floor(rng() * 6);
    const perHead = 3000 + Math.floor(rng() * 90000);
    const budget = perHead * travelers;
    const slab = assignSlab(perHead);
    const daysOut = 10 + Math.floor(rng() * 150);
    const travelDate = new Date(Date.now() + daysOut * 86_400_000);
    const createdHrsAgo = Math.floor(rng() * 120);
    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    const otpVerified = rng() > 0.25;
    const prefCount = 1 + Math.floor(rng() * 3);
    const prefs = Array.from({ length: prefCount }, () => pick(rng, PREF_BITS));

    // Admin moderation states are the only ones that hide a lead; everything
    // else stays available to every agency.
    const roll = rng();
    let status: FullLead["status"];
    if (roll > 0.95) status = "FRAUD";
    else if (roll > 0.9) status = "HIDDEN";
    else status = otpVerified ? "AVAILABLE" : "NEW";

    // Some available leads have already been unlocked by a few agencies.
    const purchasedBy: string[] = [];
    if (status === "AVAILABLE" && rng() > 0.5) {
      const n = 1 + Math.floor(rng() * 3);
      for (let k = 0; k < n; k++) purchasedBy.push(`agency_${100 + Math.floor(rng() * 12)}`);
    }

    out.push({
      id: `lead_${1000 + i}`,
      reference: `TS-${(i * 7 + 100).toString(36).toUpperCase().padStart(4, "0")}`,
      status,
      purchasedBy: Array.from(new Set(purchasedBy)),
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      mobile: `9${(700000000 + Math.floor(rng() * 99999999)).toString().slice(0, 9)}`,
      preferences: `${pick(rng, TYPES)} trip. Wants: ${prefs.join(", ")}.`,
      departureCity: pick(rng, CITIES),
      travelDateISO: travelDate.toISOString(),
      destination: pick(rng, DESTS),
      travelers,
      budget,
      perHead,
      slab: slab.id,
      price: slab.leadPrice,
      leadScore: Math.min(100, 40 + (otpVerified ? 25 : 0) + Math.floor(rng() * 30)),
      otpVerified,
      createdAtISO: new Date(Date.now() - createdHrsAgo * 3_600_000).toISOString(),
    });
  }
  return out;
}

const g = globalThis as unknown as { __leads?: FullLead[] };
const leads: FullLead[] = g.__leads ?? (g.__leads = generate(48));

// ===========================================================================
// Prisma <-> domain mappers
// ===========================================================================

type LeadWithRelations = Lead & {
  traveler?: Traveler | null;
  purchases?: { agencyId: string }[];
};

function rowToFullLead(row: LeadWithRelations): FullLead {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    purchasedBy: row.purchases?.map((p) => p.agencyId) ?? [],
    name: row.traveler?.name ?? "",
    email: row.traveler?.email ?? "",
    mobile: row.traveler?.mobile ?? "",
    preferences: row.preferences ?? "",
    departureCity: row.departureCity,
    travelDateISO: row.travelDate.toISOString(),
    destination: row.destination,
    travelers: row.travelers,
    budget: row.budget,
    perHead: row.perHead,
    slab: row.slab,
    price: row.price,
    leadScore: row.leadScore,
    otpVerified: row.otpVerified,
    createdAtISO: row.createdAt.toISOString(),
  };
}

// ===========================================================================
// Marketplace (agency-facing, masked, non-exclusive)
// ===========================================================================

export interface MarketFilters {
  slab?: SlabId;
  destination?: string;
  minScore?: number;
  /** Hide leads the requesting agency has already unlocked. */
  hideSold?: boolean;
  sort?: "newest" | "score" | "priceLow" | "priceHigh";
}

export function listMarketplace(
  filters: MarketFilters = {},
  agencyId?: string,
): Promise<MarketplaceLead[]> {
  return withDb(
    async (db) => {
      const rows = await db.lead.findMany({
        where: {
          status: { notIn: ["HIDDEN", "FRAUD"] },
          ...(filters.slab ? { slab: filters.slab } : {}),
          ...(filters.destination ? { destination: filters.destination } : {}),
          ...(typeof filters.minScore === "number"
            ? { leadScore: { gte: filters.minScore } }
            : {}),
          // Hide leads *this* agency already unlocked (not ones others bought).
          ...(filters.hideSold && agencyId
            ? { NOT: { purchases: { some: { agencyId } } } }
            : {}),
        },
        orderBy:
          filters.sort === "score"
            ? { leadScore: "desc" }
            : filters.sort === "priceLow"
              ? { price: "asc" }
              : filters.sort === "priceHigh"
                ? { price: "desc" }
                : { createdAt: "desc" },
        include: { purchases: { select: { agencyId: true } } },
      });
      return rows.map((r) => {
        const owned = agencyId ? r.purchases.some((p) => p.agencyId === agencyId) : false;
        return toMarketplaceLead(rowToFullLead(r), budgetRangeFor(r.slab), owned);
      });
    },
    () => listMarketplaceMemory(filters, agencyId),
  );
}

function listMarketplaceMemory(filters: MarketFilters, agencyId?: string): MarketplaceLead[] {
  let rows = leads.filter((l) => l.status !== "HIDDEN" && l.status !== "FRAUD");
  if (filters.slab) rows = rows.filter((l) => l.slab === filters.slab);
  if (filters.destination) rows = rows.filter((l) => l.destination === filters.destination);
  if (typeof filters.minScore === "number")
    rows = rows.filter((l) => l.leadScore >= filters.minScore!);
  if (filters.hideSold && agencyId)
    rows = rows.filter((l) => !l.purchasedBy.includes(agencyId));

  const masked = rows.map((l) =>
    toMarketplaceLead(l, budgetRangeFor(l.slab), agencyId ? l.purchasedBy.includes(agencyId) : false),
  );
  switch (filters.sort) {
    case "score":
      masked.sort((a, b) => b.leadScore - a.leadScore);
      break;
    case "priceLow":
      masked.sort((a, b) => a.price - b.price);
      break;
    case "priceHigh":
      masked.sort((a, b) => b.price - a.price);
      break;
    default:
      masked.sort((a, b) => a.postedAgoHours - b.postedAgoHours);
  }
  return masked;
}

export function getMarketplaceLead(id: string, agencyId?: string): Promise<MarketplaceLead | null> {
  return withDb(
    async (db) => {
      const row = await db.lead.findUnique({
        where: { id },
        include: { purchases: { select: { agencyId: true } } },
      });
      if (!row) return null;
      const owned = agencyId ? row.purchases.some((p) => p.agencyId === agencyId) : false;
      return toMarketplaceLead(rowToFullLead(row), budgetRangeFor(row.slab), owned);
    },
    () => {
      const l = leads.find((x) => x.id === id);
      return l
        ? toMarketplaceLead(l, budgetRangeFor(l.slab), agencyId ? l.purchasedBy.includes(agencyId) : false)
        : null;
    },
  );
}

export function destinationsInMarket(): Promise<string[]> {
  return withDb(
    async (db) => {
      const rows = await db.lead.findMany({
        where: { status: { notIn: ["HIDDEN", "FRAUD"] } },
        select: { destination: true },
        distinct: ["destination"],
      });
      return rows.map((r) => r.destination).sort();
    },
    () => Array.from(new Set(leads.map((l) => l.destination))).sort(),
  );
}

// ===========================================================================
// Purchase / reveal (non-exclusive — any agency can unlock any available lead)
// ===========================================================================

export interface PurchaseResult {
  ok: boolean;
  error?: string;
  invoiceNo?: string;
  contact?: RevealedContact;
  reference?: string;
  amount?: number;
}

export function purchaseLead(leadId: string, agencyId: string): Promise<PurchaseResult> {
  return withDb(
    async (db) => {
      return db.$transaction(async (tx) => {
        const lead = await tx.lead.findUnique({
          where: { id: leadId },
          include: {
            traveler: true,
            purchases: { where: { agencyId }, select: { invoiceNo: true, agencyId: true } },
          },
        });
        if (!lead) return { ok: false, error: "Lead not found" };
        if (lead.status === "HIDDEN" || lead.status === "FRAUD")
          return { ok: false, error: "Lead not available" };

        // Idempotent per agency: re-purchasing just returns the existing unlock.
        let invoiceNo = lead.purchases[0]?.invoiceNo;
        if (!invoiceNo) {
          invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
          await tx.purchase.create({
            data: { leadId: lead.id, agencyId, amount: lead.price, invoiceNo },
          });
        }
        return {
          ok: true,
          invoiceNo,
          reference: lead.reference,
          amount: lead.price,
          contact: revealContact(rowToFullLead(lead)),
        };
      });
    },
    () => purchaseLeadMemory(leadId, agencyId),
  );
}

function purchaseLeadMemory(leadId: string, agencyId: string): PurchaseResult {
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return { ok: false, error: "Lead not found" };
  if (lead.status === "HIDDEN" || lead.status === "FRAUD")
    return { ok: false, error: "Lead not available" };
  if (!lead.purchasedBy.includes(agencyId)) lead.purchasedBy.push(agencyId);
  return {
    ok: true,
    invoiceNo: `INV-${Date.now().toString(36).toUpperCase()}`,
    reference: lead.reference,
    amount: lead.price,
    contact: revealContact(lead),
  };
}

// ===========================================================================
// Lead creation (traveler submission)
// ===========================================================================

export interface NewLeadInput {
  reference: string;
  name: string;
  email: string;
  mobile: string;
  preferences: string;
  departureCity: string;
  travelDateISO: string;
  destination: string;
  tripType: string;
  travelers: number;
  budget: number;
  perHead: number;
  slab: SlabId;
  leadScore: number;
  otpVerified: boolean;
}

export function appendLead(input: NewLeadInput): Promise<FullLead> {
  return withDb(
    async (db) => {
      const traveler =
        (await db.traveler.findFirst({
          where: { email: input.email, mobile: input.mobile },
        })) ??
        (await db.traveler.create({
          data: { name: input.name, email: input.email, mobile: input.mobile },
        }));

      const lead = await db.lead.create({
        data: {
          reference: input.reference,
          status: input.otpVerified ? "AVAILABLE" : "NEW",
          destination: input.destination,
          departureCity: input.departureCity,
          travelers: input.travelers,
          budget: input.budget,
          perHead: input.perHead,
          travelDate: new Date(input.travelDateISO),
          tripType: input.tripType,
          preferences: input.preferences || null,
          slab: input.slab,
          price: getSlab(input.slab).leadPrice,
          leadScore: input.leadScore,
          otpVerified: input.otpVerified,
          travelerId: traveler.id,
        },
        include: { traveler: true, purchases: { select: { agencyId: true } } },
      });
      return rowToFullLead(lead);
    },
    () => appendLeadMemory(input),
  );
}

function appendLeadMemory(input: NewLeadInput): FullLead {
  const lead: FullLead = {
    id: `lead_${Date.now().toString(36)}`,
    reference: input.reference,
    status: input.otpVerified ? "AVAILABLE" : "NEW",
    purchasedBy: [],
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    preferences: input.preferences,
    departureCity: input.departureCity,
    travelDateISO: input.travelDateISO,
    destination: input.destination,
    travelers: input.travelers,
    budget: input.budget,
    perHead: input.perHead,
    slab: input.slab,
    price: getSlab(input.slab).leadPrice,
    leadScore: input.leadScore,
    otpVerified: input.otpVerified,
    createdAtISO: new Date().toISOString(),
  };
  leads.unshift(lead);
  return lead;
}

// ===========================================================================
// ADMIN surface — full access (PII allowed; admin is trusted + audited).
// ===========================================================================

export interface AdminLeadRow {
  id: string;
  reference: string;
  destination: string;
  travelerName: string;
  budget: number;
  perHead: number;
  slab: SlabId;
  status: FullLead["status"];
  leadScore: number;
  travelers: number;
  /** How many agencies have unlocked this lead. */
  purchaseCount: number;
  createdAtISO: string;
}

function toAdminRow(l: FullLead): AdminLeadRow {
  return {
    id: l.id,
    reference: l.reference,
    destination: l.destination,
    travelerName: l.name,
    budget: l.budget,
    perHead: l.perHead,
    slab: l.slab,
    status: l.status,
    leadScore: l.leadScore,
    travelers: l.travelers,
    purchaseCount: l.purchasedBy.length,
    createdAtISO: l.createdAtISO,
  };
}

export function adminListLeads(status?: FullLead["status"]): Promise<AdminLeadRow[]> {
  return withDb(
    async (db) => {
      const rows = await db.lead.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        include: { traveler: true, purchases: { select: { agencyId: true } } },
      });
      return rows.map((r) => toAdminRow(rowToFullLead(r)));
    },
    () =>
      leads
        .filter((l) => !status || l.status === status)
        .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO))
        .map(toAdminRow),
  );
}

export type LeadAction = "hide" | "unhide" | "mark_fraud" | "delete" | "assign";

export function adminLeadAction(
  id: string,
  action: LeadAction,
  payload?: { status?: FullLead["status"] },
): Promise<{ ok: boolean; error?: string }> {
  return withDb(
    async (db) => {
      const lead = await db.lead.findUnique({ where: { id } });
      if (!lead) return { ok: false, error: "Lead not found" };

      switch (action) {
        case "hide":
          await db.lead.update({ where: { id }, data: { status: "HIDDEN" } });
          break;
        case "unhide":
          await db.lead.update({ where: { id }, data: { status: "AVAILABLE" } });
          break;
        case "mark_fraud":
          await db.lead.update({ where: { id }, data: { status: "FRAUD" } });
          break;
        case "assign":
          if (payload?.status)
            await db.lead.update({ where: { id }, data: { status: payload.status } });
          break;
        case "delete":
          await db.purchase.deleteMany({ where: { leadId: id } });
          await db.lead.delete({ where: { id } });
          break;
      }
      return { ok: true };
    },
    () => adminLeadActionMemory(id, action, payload),
  );
}

function adminLeadActionMemory(
  id: string,
  action: LeadAction,
  payload?: { status?: FullLead["status"] },
): { ok: boolean; error?: string } {
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return { ok: false, error: "Lead not found" };
  const lead = leads[idx];
  switch (action) {
    case "hide":
      lead.status = "HIDDEN";
      break;
    case "unhide":
      lead.status = "AVAILABLE";
      break;
    case "mark_fraud":
      lead.status = "FRAUD";
      break;
    case "assign":
      if (payload?.status) lead.status = payload.status;
      break;
    case "delete":
      leads.splice(idx, 1);
      break;
  }
  return { ok: true };
}

export interface LeadStats {
  total: number;
  sold: number; // leads unlocked by >= 1 agency
  available: number;
  hidden: number;
  fraud: number;
  revenue: number; // sum of every unlock (a lead can be sold many times)
  conversionRate: number; // sold / total, 0..1
}

export function leadStats(): Promise<LeadStats> {
  return withDb(
    async (db) => {
      const [total, available, hidden, fraud, sold, rev] = await Promise.all([
        db.lead.count(),
        db.lead.count({ where: { status: "AVAILABLE" } }),
        db.lead.count({ where: { status: "HIDDEN" } }),
        db.lead.count({ where: { status: "FRAUD" } }),
        db.lead.count({ where: { purchases: { some: {} } } }),
        db.purchase.aggregate({ _sum: { amount: true } }),
      ]);
      return {
        total,
        sold,
        available,
        hidden,
        fraud,
        revenue: rev._sum.amount ?? 0,
        conversionRate: total ? sold / total : 0,
      };
    },
    () => leadStatsMemory(),
  );
}

function leadStatsMemory(): LeadStats {
  const total = leads.length;
  const sold = leads.filter((l) => l.purchasedBy.length > 0).length;
  const available = leads.filter((l) => l.status === "AVAILABLE").length;
  const hidden = leads.filter((l) => l.status === "HIDDEN").length;
  const fraud = leads.filter((l) => l.status === "FRAUD").length;
  const revenue = leads.reduce((sum, l) => sum + l.purchasedBy.length * l.price, 0);
  return { total, sold, available, hidden, fraud, revenue, conversionRate: total ? sold / total : 0 };
}

/** Each unlock is a revenue event, as {dateISO, amount} for revenue charts. */
export function soldLeadEvents(): Promise<{ dateISO: string; amount: number }[]> {
  return withDb(
    async (db) => {
      const rows = await db.purchase.findMany({ select: { createdAt: true, amount: true } });
      return rows.map((r) => ({ dateISO: r.createdAt.toISOString(), amount: r.amount }));
    },
    () => {
      const out: { dateISO: string; amount: number }[] = [];
      for (const l of leads)
        for (let k = 0; k < l.purchasedBy.length; k++)
          out.push({ dateISO: l.createdAtISO, amount: l.price });
      return out;
    },
  );
}
