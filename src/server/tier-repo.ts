/**
 * Admin-managed slab tiers (budget ranges per traveller).
 *
 * These drive lead PRICING, AUTO-HIDE and the slab LABEL shown in the admin
 * panel + traveler dashboard. The agency marketplace still uses the fixed bands
 * in `@/lib/slabs`, so leads keep a legacy `slab` enum for that.
 *
 * Prisma/Postgres when configured (seeded from the built-in slabs on first
 * use), else an in-memory fallback.
 */

import type { PrismaClient } from "@prisma/client";
import { withDb } from "@/lib/persistence";
import { SLABS, isPremiumSlab } from "@/lib/slabs";

export interface SlabTier {
  id: string;
  label: string;
  minPerHead: number;
  /** null = no upper bound (top tier). */
  maxPerHead: number | null;
  leadPrice: number;
  autoHide: boolean;
  order: number;
}

type TierRow = {
  id: string;
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
  leadPrice: number;
  autoHide: boolean;
  order: number;
};

function rowToTier(r: TierRow): SlabTier {
  return {
    id: r.id,
    label: r.label,
    minPerHead: r.minPerHead,
    maxPerHead: r.maxPerHead,
    leadPrice: r.leadPrice,
    autoHide: r.autoHide,
    order: r.order,
  };
}

/** Default tiers derived from the built-in slabs (used to seed + as fallback). */
function defaultTiers(): SlabTier[] {
  return SLABS.map((s, i) => ({
    id: s.id,
    label: s.label,
    minPerHead: s.min,
    maxPerHead: Number.isFinite(s.max) ? s.max : null,
    leadPrice: s.leadPrice,
    autoHide: isPremiumSlab(s.id),
    order: i,
  }));
}

// --- in-memory fallback -----------------------------------------------------
const g = globalThis as unknown as { __slabTiers?: SlabTier[] };
const memTiers = g.__slabTiers ?? (g.__slabTiers = defaultTiers());

/** Choose the tier a per-traveller budget falls into (sorted by lower bound). */
export function pickTier(tiers: SlabTier[], perHead: number): SlabTier {
  const sorted = [...tiers].sort((a, b) => a.minPerHead - b.minPerHead);
  for (const t of sorted) {
    const underMax = t.maxPerHead == null || perHead < t.maxPerHead;
    if (perHead >= t.minPerHead && underMax) return t;
  }
  // Nothing matched (gap / above all bounds) → highest tier.
  return sorted[sorted.length - 1];
}

/** Ensure the table has tiers (seed defaults on first use), return the rows. */
async function ensureTiers(db: PrismaClient): Promise<TierRow[]> {
  const rows = await db.slabTier.findMany({ orderBy: { order: "asc" } });
  if (rows.length) return rows;
  await db.slabTier.createMany({
    data: defaultTiers().map((t) => ({
      label: t.label,
      minPerHead: t.minPerHead,
      maxPerHead: t.maxPerHead,
      leadPrice: t.leadPrice,
      autoHide: t.autoHide,
      order: t.order,
    })),
  });
  return db.slabTier.findMany({ orderBy: { order: "asc" } });
}

/**
 * Resolve the tier for a budget using the DB (raw — call inside an existing
 * withDb so the same connection/seed is reused, e.g. from appendLead).
 */
export async function resolveTierDb(db: PrismaClient, perHead: number): Promise<SlabTier> {
  const rows = await ensureTiers(db);
  return pickTier(rows.map(rowToTier), perHead);
}

/** Resolve the tier for a budget in memory-fallback mode. */
export function resolveTierMemory(perHead: number): SlabTier {
  return pickTier(memTiers, perHead);
}

/** Resolve the tier for a budget (DB when configured, else memory). */
export function resolveTier(perHead: number): Promise<SlabTier> {
  return withDb(
    (db) => resolveTierDb(db, perHead),
    () => resolveTierMemory(perHead),
  );
}

// --- admin CRUD -------------------------------------------------------------

export function listSlabTiers(): Promise<SlabTier[]> {
  return withDb(
    async (db) => (await ensureTiers(db)).map(rowToTier),
    () => [...memTiers].sort((a, b) => a.order - b.order),
  );
}

export interface TierInput {
  label: string;
  minPerHead: number;
  maxPerHead: number | null;
  leadPrice: number;
  autoHide: boolean;
}

export function createSlabTier(input: TierInput): Promise<SlabTier> {
  return withDb(
    async (db) => {
      const max = await db.slabTier.aggregate({ _max: { order: true } });
      const order = (max._max.order ?? -1) + 1;
      const row = await db.slabTier.create({ data: { ...input, order } });
      return rowToTier(row);
    },
    () => {
      const order = memTiers.reduce((m, t) => Math.max(m, t.order), -1) + 1;
      const tier: SlabTier = { id: `tier_${Date.now().toString(36)}`, ...input, order };
      memTiers.push(tier);
      return tier;
    },
  );
}

export function updateSlabTier(
  id: string,
  patch: Partial<TierInput>,
): Promise<SlabTier | null> {
  return withDb(
    async (db) => {
      const row = await db.slabTier
        .update({ where: { id }, data: patch })
        .catch(() => null);
      return row ? rowToTier(row) : null;
    },
    () => {
      const t = memTiers.find((x) => x.id === id);
      if (!t) return null;
      Object.assign(t, patch);
      return t;
    },
  );
}

export function deleteSlabTier(id: string): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.slabTier.deleteMany({ where: { id } });
      return res.count > 0;
    },
    () => {
      const i = memTiers.findIndex((x) => x.id === id);
      if (i === -1) return false;
      memTiers.splice(i, 1);
      return true;
    },
  );
}
