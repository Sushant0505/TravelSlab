/**
 * Trip types / categories — admin-managed (Backpacking, Bike Trips, …).
 *
 * Drives the mega-menu category column + homepage trip tabs, and is the "type"
 * an agency tags each package with. Auto-seeds from a built-in list on first
 * use (same pattern as destination-repo / tier-repo), else in-memory fallback.
 */

import type { PrismaClient } from "@prisma/client";
import { withDb } from "@/lib/persistence";
import { slugify } from "@/lib/utils";

export interface TripTypeRecord {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  icon: string; // lucide icon name (see ALLOWED_ICONS in the UI)
  order: number;
  active: boolean;
}

export interface TripTypeInput {
  name: string;
  slug?: string;
  subtitle?: string;
  icon?: string;
  active?: boolean;
}

const SEED: Omit<TripTypeRecord, "id">[] = [
  { name: "Backpacking Trips", slug: "backpacking", subtitle: "Budget group adventures", icon: "Backpack", order: 0, active: true },
  { name: "Bike Trips", slug: "bike-trips", subtitle: "Ladakh, Spiti, Zanskar", icon: "Bike", order: 1, active: true },
  { name: "Himalayan Treks", slug: "himalayan-treks", subtitle: "Himachal, Uttarakhand & Kashmir", icon: "Mountain", order: 2, active: true },
  { name: "Beach & Islands", slug: "beach-islands", subtitle: "Goa, Andaman, Bali & more", icon: "Waves", order: 3, active: true },
  { name: "Family Trips", slug: "family", subtitle: "Comfortable & kid-friendly", icon: "Users", order: 4, active: true },
  { name: "Honeymoon", slug: "honeymoon", subtitle: "Romantic escapes", icon: "Heart", order: 5, active: true },
  { name: "Adventure", slug: "adventure", subtitle: "Treks, biking & rafting", icon: "Compass", order: 6, active: true },
  { name: "All Girls Trips", slug: "all-girls", subtitle: "Women only trips", icon: "Sparkles", order: 7, active: true },
];

const g = globalThis as unknown as { __tripTypes?: TripTypeRecord[] };
const memTypes =
  g.__tripTypes ??
  (g.__tripTypes = SEED.map((t, i) => ({ ...t, id: `type_${t.slug}`, order: i })));

type Row = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  icon: string;
  order: number;
  active: boolean;
};
function rowTo(r: Row): TripTypeRecord {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    subtitle: r.subtitle ?? "",
    icon: r.icon,
    order: r.order,
    active: r.active,
  };
}

async function ensureTypes(db: PrismaClient): Promise<void> {
  const count = await db.tripType.count();
  if (count > 0) return;
  await db.tripType.createMany({
    data: SEED.map((t, i) => ({
      name: t.name,
      slug: t.slug,
      subtitle: t.subtitle,
      icon: t.icon,
      order: i,
      active: true,
    })),
  });
}

const byOrder = (a: TripTypeRecord, b: TripTypeRecord) =>
  a.order - b.order || a.name.localeCompare(b.name);

export function listPublicTripTypes(): Promise<TripTypeRecord[]> {
  return withDb(
    async (db) => {
      await ensureTypes(db);
      const rows = await db.tripType.findMany({
        where: { active: true },
        orderBy: { order: "asc" },
      });
      return rows.map((r) => rowTo(r as Row));
    },
    () => memTypes.filter((t) => t.active).sort(byOrder),
  );
}

export function getPublicTripTypeBySlug(slug: string): Promise<TripTypeRecord | null> {
  return withDb(
    async (db) => {
      await ensureTypes(db);
      const r = await db.tripType.findFirst({ where: { slug, active: true } });
      return r ? rowTo(r as Row) : null;
    },
    () => memTypes.find((t) => t.slug === slug && t.active) ?? null,
  );
}

export function listPublicTripTypeSlugs(): Promise<string[]> {
  return withDb(
    async (db) => {
      await ensureTypes(db);
      const rows = await db.tripType.findMany({ where: { active: true }, select: { slug: true } });
      return rows.map((r) => r.slug);
    },
    () => memTypes.filter((t) => t.active).map((t) => t.slug),
  );
}

export function adminListTripTypes(): Promise<TripTypeRecord[]> {
  return withDb(
    async (db) => {
      await ensureTypes(db);
      const rows = await db.tripType.findMany({ orderBy: { order: "asc" } });
      return rows.map((r) => rowTo(r as Row));
    },
    () => [...memTypes].sort(byOrder),
  );
}

async function uniqueSlug(db: PrismaClient, base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || "type";
  let slug = root;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await db.tripType.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${root}-${n++}`;
  }
}

export function createTripType(input: TripTypeInput): Promise<TripTypeRecord> {
  return withDb(
    async (db) => {
      const slug = await uniqueSlug(db, input.slug || input.name);
      const max = await db.tripType.aggregate({ _max: { order: true } });
      const row = await db.tripType.create({
        data: {
          name: input.name,
          slug,
          subtitle: input.subtitle ?? null,
          icon: input.icon ?? "Compass",
          order: (max._max.order ?? -1) + 1,
          active: input.active ?? true,
        },
      });
      return rowTo(row as Row);
    },
    () => {
      const order = memTypes.reduce((m, t) => Math.max(m, t.order), -1) + 1;
      const rec: TripTypeRecord = {
        id: `type_${Date.now().toString(36)}`,
        name: input.name,
        slug: slugify(input.slug || input.name) || `type-${order}`,
        subtitle: input.subtitle ?? "",
        icon: input.icon ?? "Compass",
        order,
        active: input.active ?? true,
      };
      memTypes.push(rec);
      return rec;
    },
  );
}

export function updateTripType(id: string, input: TripTypeInput): Promise<TripTypeRecord | null> {
  return withDb(
    async (db) => {
      const existing = await db.tripType.findUnique({ where: { id } });
      if (!existing) return null;
      const slug = input.slug ? await uniqueSlug(db, input.slug, id) : existing.slug;
      const row = await db.tripType.update({
        where: { id },
        data: {
          name: input.name,
          slug,
          subtitle: input.subtitle ?? null,
          icon: input.icon ?? existing.icon,
          active: input.active ?? existing.active,
        },
      });
      return rowTo(row as Row);
    },
    () => {
      const t = memTypes.find((x) => x.id === id);
      if (!t) return null;
      Object.assign(t, {
        name: input.name,
        slug: input.slug ? slugify(input.slug) : t.slug,
        subtitle: input.subtitle ?? t.subtitle,
        icon: input.icon ?? t.icon,
        active: input.active ?? t.active,
      });
      return t;
    },
  );
}

export function patchTripType(
  id: string,
  patch: { active?: boolean; order?: number },
): Promise<boolean> {
  return withDb(
    async (db) => {
      const r = await db.tripType.update({ where: { id }, data: patch }).catch(() => null);
      return r != null;
    },
    () => {
      const t = memTypes.find((x) => x.id === id);
      if (!t) return false;
      Object.assign(t, patch);
      return true;
    },
  );
}

export function deleteTripType(id: string): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.tripType.deleteMany({ where: { id } });
      return res.count > 0;
    },
    () => {
      const i = memTypes.findIndex((x) => x.id === id);
      if (i === -1) return false;
      memTypes.splice(i, 1);
      return true;
    },
  );
}
