/**
 * Slab pricing — the per-lead price an agency pays to unlock a lead in each
 * budget slab. Admin-editable overrides are stored in the `SlabPricing` table
 * and layered over the static defaults in `@/lib/slabs`.
 *
 * New leads read the effective price at creation time (see lead-repo), so
 * changing a slab's price affects future leads, not already-created ones.
 */

import { withDb } from "@/lib/persistence";
import { SLABS, getSlab, type SlabId } from "@/lib/slabs";

const g = globalThis as unknown as { __slabPriceOverrides?: Map<SlabId, number> };
const overrides = g.__slabPriceOverrides ?? (g.__slabPriceOverrides = new Map());

/** Effective price in memory-fallback mode: override, else static default. */
export function memGetPrice(slab: SlabId): number {
  return overrides.get(slab) ?? getSlab(slab).leadPrice;
}

export interface SlabPriceRow {
  slab: SlabId;
  label: string;
  min: number;
  max: number;
  defaultPrice: number;
  price: number;
  customized: boolean;
}

/** All slabs with their current (possibly overridden) price + the default. */
export function listSlabPricing(): Promise<SlabPriceRow[]> {
  return withDb(
    async (db) => {
      const rows = await db.slabPricing.findMany();
      const map = new Map(rows.map((r) => [r.slab as SlabId, r.leadPrice]));
      return SLABS.map((s) => {
        const price = map.get(s.id) ?? s.leadPrice;
        return {
          slab: s.id,
          label: s.label,
          min: s.min,
          max: s.max,
          defaultPrice: s.leadPrice,
          price,
          // "Custom" only when the price actually differs from the default
          // (the DB is seeded with defaults, so row-existence isn't enough).
          customized: price !== s.leadPrice,
        };
      });
    },
    () =>
      SLABS.map((s) => {
        const price = overrides.get(s.id) ?? s.leadPrice;
        return {
          slab: s.id,
          label: s.label,
          min: s.min,
          max: s.max,
          defaultPrice: s.leadPrice,
          price,
          customized: price !== s.leadPrice,
        };
      }),
  );
}

/** Set (upsert) the price for one slab. */
export function setSlabPrice(slab: SlabId, price: number): Promise<{ ok: boolean }> {
  return withDb(
    async (db) => {
      await db.slabPricing.upsert({
        where: { slab },
        create: { slab, leadPrice: price },
        update: { leadPrice: price },
      });
      return { ok: true };
    },
    () => {
      overrides.set(slab, price);
      return { ok: true };
    },
  );
}

/** Remove an override so the slab reverts to its default price. */
export function resetSlabPrice(slab: SlabId): Promise<{ ok: boolean }> {
  return withDb(
    async (db) => {
      await db.slabPricing.deleteMany({ where: { slab } });
      return { ok: true };
    },
    () => {
      overrides.delete(slab);
      return { ok: true };
    },
  );
}
