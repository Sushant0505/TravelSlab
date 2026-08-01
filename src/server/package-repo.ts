/**
 * Package repository — trip packages created by agencies.
 *
 * AGENCY PRIVACY IS ENFORCED HERE. The `PublicPackage` projection deliberately
 * omits `agencyId` and every agency field, so no public route can ever leak
 * which agency created a package. Only agency-scoped and admin routes (both
 * behind RBAC middleware) receive `AgencyPackage` / `AdminPackage`, which carry
 * status + (for admin) the agency name for moderation.
 *
 * Lifecycle:  agency creates -> PENDING -> admin APPROVED (public) | REJECTED |
 * HIDDEN.  Agency can PAUSE an approved package (hidden from public, resumable).
 * Editing content re-enters PENDING so admins re-review before it goes live.
 *
 * Prisma/Postgres when configured, else an in-memory fallback (starts empty —
 * no seeded/fake packages).
 */

import type { PrismaClient, Prisma } from "@prisma/client";
import { withDb } from "@/lib/persistence";
import { slugify } from "@/lib/utils";

export type PackageStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "HIDDEN"
  | "PAUSED";

export interface ItineraryDay {
  day: number;
  title: string;
  detail: string;
}

/** Traveller-facing package — NO agency identity of any kind. */
export interface PublicPackage {
  id: string;
  slug: string;
  name: string;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  duration: string;
  durationDays: number;
  price: number;
  slabLabel: string;
  typeId: string;
  typeLabel: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: ItineraryDay[];
  maxTravelers: number;
  featured: boolean;
  popular: boolean;
  images: string[];
  heroImage: string;
  dates: string[];
  createdAtISO: string;
}

/** Adds moderation state — returned only to the owning agency. */
export interface AgencyPackage extends PublicPackage {
  status: PackageStatus;
  order: number;
}

/** Adds the agency name — returned only to admins. */
export interface AdminPackage extends AgencyPackage {
  agencyName: string;
}

export interface PackageInput {
  name: string;
  destinationId: string;
  duration: string;
  durationDays: number;
  price: number;
  slabId?: string | null;
  slabLabel?: string | null;
  typeId?: string | null;
  typeLabel?: string | null;
  description: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: ItineraryDay[];
  maxTravelers: number;
  featured?: boolean;
  popular?: boolean;
  images: string[];
  dates: string[]; // ISO date strings
}

// ---------------------------------------------------------------------------
// In-memory fallback store (starts empty)
// ---------------------------------------------------------------------------

interface MemPackage {
  id: string;
  slug: string;
  name: string;
  agencyId: string;
  agencyName: string;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  destinationHero: string;
  duration: string;
  durationDays: number;
  price: number;
  slabId: string | null;
  slabLabel: string;
  typeId: string | null;
  typeLabel: string;
  description: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: ItineraryDay[];
  maxTravelers: number;
  featured: boolean;
  popular: boolean;
  status: PackageStatus;
  order: number;
  images: string[];
  dates: string[];
  createdAtISO: string;
}

const g = globalThis as unknown as { __packages?: MemPackage[] };
const memPackages = g.__packages ?? (g.__packages = []);

// ---------------------------------------------------------------------------
// Prisma include + mappers
// ---------------------------------------------------------------------------

const FULL_INCLUDE = {
  destination: { select: { slug: true, name: true, heroImage: true } },
  agency: { select: { name: true } },
  images: { orderBy: { order: "asc" } },
  dates: { orderBy: { date: "asc" } },
} as const;

type PkgRow = {
  id: string;
  slug: string;
  name: string;
  agencyId: string;
  destinationId: string;
  duration: string;
  durationDays: number;
  price: number;
  slabId: string | null;
  slabLabel: string | null;
  typeId: string | null;
  typeLabel: string | null;
  description: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary: unknown;
  maxTravelers: number;
  featured: boolean;
  popular: boolean;
  status: PackageStatus;
  order: number;
  createdAt: Date;
  destination: { slug: string; name: string; heroImage: string };
  agency?: { name: string };
  images: { dataUrl: string }[];
  dates: { date: Date }[];
};

function coerceItinerary(value: unknown): ItineraryDay[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => typeof v === "object" && v != null)
    .map((v, i) => ({
      day: typeof v.day === "number" ? v.day : i + 1,
      title: String(v.title ?? ""),
      detail: String(v.detail ?? ""),
    }));
}

function rowToPublic(r: PkgRow): PublicPackage {
  const images = r.images.map((im) => im.dataUrl);
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    destinationId: r.destinationId,
    destinationSlug: r.destination.slug,
    destinationName: r.destination.name,
    duration: r.duration,
    durationDays: r.durationDays,
    price: r.price,
    slabLabel: r.slabLabel ?? "",
    typeId: r.typeId ?? "",
    typeLabel: r.typeLabel ?? "",
    description: r.description,
    inclusions: r.inclusions,
    exclusions: r.exclusions,
    highlights: r.highlights,
    itinerary: coerceItinerary(r.itinerary),
    maxTravelers: r.maxTravelers,
    featured: r.featured,
    popular: r.popular,
    images,
    heroImage: images[0] ?? r.destination.heroImage,
    dates: r.dates.map((d) => d.date.toISOString()),
    createdAtISO: r.createdAt.toISOString(),
  };
}

function rowToAgency(r: PkgRow): AgencyPackage {
  return { ...rowToPublic(r), status: r.status, order: r.order };
}

function rowToAdmin(r: PkgRow): AdminPackage {
  return { ...rowToAgency(r), agencyName: r.agency?.name ?? "—" };
}

function memToPublic(p: MemPackage): PublicPackage {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    destinationId: p.destinationId,
    destinationSlug: p.destinationSlug,
    destinationName: p.destinationName,
    duration: p.duration,
    durationDays: p.durationDays,
    price: p.price,
    slabLabel: p.slabLabel,
    typeId: p.typeId ?? "",
    typeLabel: p.typeLabel,
    description: p.description,
    inclusions: p.inclusions,
    exclusions: p.exclusions,
    highlights: p.highlights,
    itinerary: p.itinerary,
    maxTravelers: p.maxTravelers,
    featured: p.featured,
    popular: p.popular,
    images: p.images,
    heroImage: p.images[0] ?? p.destinationHero,
    dates: p.dates,
    createdAtISO: p.createdAtISO,
  };
}
const memToAgency = (p: MemPackage): AgencyPackage => ({
  ...memToPublic(p),
  status: p.status,
  order: p.order,
});
const memToAdmin = (p: MemPackage): AdminPackage => ({
  ...memToAgency(p),
  agencyName: p.agencyName,
});

const displayCmp = (
  a: { featured: boolean; order: number; createdAtISO: string },
  b: { featured: boolean; order: number; createdAtISO: string },
) =>
  Number(b.featured) - Number(a.featured) ||
  a.order - b.order ||
  b.createdAtISO.localeCompare(a.createdAtISO);

// ---------------------------------------------------------------------------
// Public reads (APPROVED only) — agency identity stripped
// ---------------------------------------------------------------------------

export interface PublicPackageFilter {
  destinationSlug?: string;
  destinationId?: string;
  minPrice?: number;
  maxPrice?: number | null;
  minDays?: number;
  maxDays?: number;
  /** 3-letter month token ("Jan".."Dec") — matches a departure date. */
  month?: string;
  /** TripType id — filter to packages tagged with this category. */
  typeId?: string;
  featured?: boolean;
  popular?: boolean;
  limit?: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function matchesMonth(dates: string[], month?: string): boolean {
  if (!month) return true;
  const idx = MONTHS.findIndex((m) => m.toLowerCase() === month.slice(0, 3).toLowerCase());
  if (idx < 0) return true;
  return dates.some((d) => new Date(d).getMonth() === idx);
}

function inPriceRange(price: number, min?: number, max?: number | null): boolean {
  if (min != null && price < min) return false;
  if (max != null && price >= max) return false;
  return true;
}

function inDayRange(days: number, min?: number, max?: number): boolean {
  if (min != null && days < min) return false;
  if (max != null && days > max) return false;
  return true;
}

export function listPublicPackages(
  filter: PublicPackageFilter = {},
): Promise<PublicPackage[]> {
  return withDb(
    async (db) => {
      const rows = await db.package.findMany({
        where: {
          status: "APPROVED",
          ...(filter.destinationId ? { destinationId: filter.destinationId } : {}),
          ...(filter.destinationSlug
            ? { destination: { slug: filter.destinationSlug } }
            : {}),
          ...(filter.typeId ? { typeId: filter.typeId } : {}),
          ...(filter.featured != null ? { featured: filter.featured } : {}),
          ...(filter.popular != null ? { popular: filter.popular } : {}),
          ...(filter.minPrice != null || filter.maxPrice != null
            ? {
                price: {
                  ...(filter.minPrice != null ? { gte: filter.minPrice } : {}),
                  ...(filter.maxPrice != null ? { lt: filter.maxPrice } : {}),
                },
              }
            : {}),
          ...(filter.minDays != null || filter.maxDays != null
            ? {
                durationDays: {
                  ...(filter.minDays != null ? { gte: filter.minDays } : {}),
                  ...(filter.maxDays != null ? { lte: filter.maxDays } : {}),
                },
              }
            : {}),
        },
        include: FULL_INCLUDE,
        orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
        take: filter.limit ? filter.limit * 4 : undefined,
      });
      let out = rows.map((r) => rowToPublic(r as PkgRow));
      if (filter.month) out = out.filter((p) => matchesMonth(p.dates, filter.month));
      return filter.limit ? out.slice(0, filter.limit) : out;
    },
    () => {
      const out = memPackages
        .filter((p) => p.status === "APPROVED")
        .filter((p) => !filter.destinationId || p.destinationId === filter.destinationId)
        .filter((p) => !filter.destinationSlug || p.destinationSlug === filter.destinationSlug)
        .filter((p) => !filter.typeId || p.typeId === filter.typeId)
        .filter((p) => filter.featured == null || p.featured === filter.featured)
        .filter((p) => filter.popular == null || p.popular === filter.popular)
        .filter((p) => inPriceRange(p.price, filter.minPrice, filter.maxPrice))
        .filter((p) => inDayRange(p.durationDays, filter.minDays, filter.maxDays))
        .filter((p) => matchesMonth(p.dates, filter.month))
        .sort(displayCmp)
        .map(memToPublic);
      return filter.limit ? out.slice(0, filter.limit) : out;
    },
  );
}

/** Approved packages for a destination (auto-injection into its page). */
export function packagesForDestination(
  destinationSlug: string,
): Promise<PublicPackage[]> {
  return listPublicPackages({ destinationSlug });
}

export function getPublicPackageBySlug(slug: string): Promise<PublicPackage | null> {
  return withDb(
    async (db) => {
      const r = await db.package.findFirst({
        where: { slug, status: "APPROVED" },
        include: FULL_INCLUDE,
      });
      return r ? rowToPublic(r as PkgRow) : null;
    },
    () => {
      const p = memPackages.find((x) => x.slug === slug && x.status === "APPROVED");
      return p ? memToPublic(p) : null;
    },
  );
}

export function listPublicPackageSlugs(): Promise<string[]> {
  return withDb(
    async (db) => {
      const rows = await db.package.findMany({
        where: { status: "APPROVED" },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    },
    () => memPackages.filter((p) => p.status === "APPROVED").map((p) => p.slug),
  );
}

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

async function uniquePkgSlug(db: PrismaClient, base: string): Promise<string> {
  const root = slugify(base) || "package";
  let slug = root;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await db.package.findFirst({ where: { slug }, select: { id: true } });
    if (!clash) return slug;
    slug = `${root}-${n++}`;
  }
}
function memUniquePkgSlug(base: string): string {
  const root = slugify(base) || "package";
  let slug = root;
  let n = 2;
  while (memPackages.some((p) => p.slug === slug)) slug = `${root}-${n++}`;
  return slug;
}

// ---------------------------------------------------------------------------
// Agency-scoped writes
// ---------------------------------------------------------------------------

export function listAgencyPackages(agencyId: string): Promise<AgencyPackage[]> {
  return withDb(
    async (db) => {
      const rows = await db.package.findMany({
        where: { agencyId },
        include: FULL_INCLUDE,
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => rowToAgency(r as PkgRow));
    },
    () =>
      memPackages
        .filter((p) => p.agencyId === agencyId)
        .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO))
        .map(memToAgency),
  );
}

export function getAgencyPackage(
  agencyId: string,
  id: string,
): Promise<AgencyPackage | null> {
  return withDb(
    async (db) => {
      const r = await db.package.findFirst({
        where: { id, agencyId },
        include: FULL_INCLUDE,
      });
      return r ? rowToAgency(r as PkgRow) : null;
    },
    () => {
      const p = memPackages.find((x) => x.id === id && x.agencyId === agencyId);
      return p ? memToAgency(p) : null;
    },
  );
}

export function createAgencyPackage(
  agencyId: string,
  agencyName: string,
  input: PackageInput,
): Promise<AgencyPackage> {
  return withDb(
    async (db) => {
      const slug = await uniquePkgSlug(db, input.name);
      const max = await db.package.aggregate({ _max: { order: true } });
      const order = (max._max.order ?? -1) + 1;
      const r = await db.package.create({
        data: {
          slug,
          name: input.name,
          agencyId,
          destinationId: input.destinationId,
          duration: input.duration,
          durationDays: input.durationDays,
          price: input.price,
          slabId: input.slabId ?? null,
          slabLabel: input.slabLabel ?? null,
          typeId: input.typeId ?? null,
          typeLabel: input.typeLabel ?? null,
          description: input.description,
          inclusions: input.inclusions,
          exclusions: input.exclusions,
          highlights: input.highlights,
          itinerary: input.itinerary as unknown as Prisma.InputJsonValue,
          maxTravelers: input.maxTravelers,
          featured: false, // only admins may feature (Handpicked departures)
          popular: input.popular ?? false, // agency may request the Popular shelf
          status: "PENDING",
          order,
          images: { create: input.images.map((dataUrl, i) => ({ dataUrl, order: i })) },
          dates: { create: input.dates.map((d) => ({ date: new Date(d) })) },
        },
        include: FULL_INCLUDE,
      });
      return rowToAgency(r as PkgRow);
    },
    async () => {
      const dest = await destMeta(input.destinationId);
      const slug = memUniquePkgSlug(input.name);
      const order = memPackages.reduce((m, p) => Math.max(m, p.order), -1) + 1;
      const rec: MemPackage = {
        id: `pkg_${Date.now().toString(36)}`,
        slug,
        name: input.name,
        agencyId,
        agencyName,
        destinationId: input.destinationId,
        destinationSlug: dest.slug,
        destinationName: dest.name,
        destinationHero: dest.heroImage,
        duration: input.duration,
        durationDays: input.durationDays,
        price: input.price,
        slabId: input.slabId ?? null,
        slabLabel: input.slabLabel ?? "",
        typeId: input.typeId ?? null,
        typeLabel: input.typeLabel ?? "",
        description: input.description,
        inclusions: input.inclusions,
        exclusions: input.exclusions,
        highlights: input.highlights,
        itinerary: input.itinerary,
        maxTravelers: input.maxTravelers,
        featured: false,
        popular: input.popular ?? false,
        status: "PENDING",
        order,
        images: input.images,
        dates: input.dates,
        createdAtISO: new Date().toISOString(),
      };
      memPackages.unshift(rec);
      return memToAgency(rec);
    },
  );
}

export function updateAgencyPackage(
  agencyId: string,
  id: string,
  input: PackageInput,
): Promise<AgencyPackage | null> {
  return withDb(
    async (db) => {
      const owned = await db.package.findFirst({ where: { id, agencyId }, select: { id: true } });
      if (!owned) return null;
      // Content edits go back to PENDING so admins re-review before it re-lists.
      await db.packageImage.deleteMany({ where: { packageId: id } });
      await db.packageDate.deleteMany({ where: { packageId: id } });
      const r = await db.package.update({
        where: { id },
        data: {
          name: input.name,
          destinationId: input.destinationId,
          duration: input.duration,
          durationDays: input.durationDays,
          price: input.price,
          slabId: input.slabId ?? null,
          slabLabel: input.slabLabel ?? null,
          typeId: input.typeId ?? null,
          typeLabel: input.typeLabel ?? null,
          description: input.description,
          inclusions: input.inclusions,
          exclusions: input.exclusions,
          highlights: input.highlights,
          itinerary: input.itinerary as unknown as Prisma.InputJsonValue,
          maxTravelers: input.maxTravelers,
          popular: input.popular ?? false,
          status: "PENDING",
          images: { create: input.images.map((dataUrl, i) => ({ dataUrl, order: i })) },
          dates: { create: input.dates.map((d) => ({ date: new Date(d) })) },
        },
        include: FULL_INCLUDE,
      });
      return rowToAgency(r as PkgRow);
    },
    async () => {
      const p = memPackages.find((x) => x.id === id && x.agencyId === agencyId);
      if (!p) return null;
      const dest = await destMeta(input.destinationId);
      Object.assign(p, {
        name: input.name,
        destinationId: input.destinationId,
        destinationSlug: dest.slug,
        destinationName: dest.name,
        destinationHero: dest.heroImage,
        duration: input.duration,
        durationDays: input.durationDays,
        price: input.price,
        slabId: input.slabId ?? null,
        slabLabel: input.slabLabel ?? "",
        typeId: input.typeId ?? null,
        typeLabel: input.typeLabel ?? "",
        description: input.description,
        inclusions: input.inclusions,
        exclusions: input.exclusions,
        highlights: input.highlights,
        itinerary: input.itinerary,
        maxTravelers: input.maxTravelers,
        popular: input.popular ?? false,
        status: "PENDING" as PackageStatus,
        images: input.images,
        dates: input.dates,
      });
      return memToAgency(p);
    },
  );
}

/** Agency pause/resume — toggles APPROVED <-> PAUSED only. */
export function setAgencyPackagePaused(
  agencyId: string,
  id: string,
  paused: boolean,
): Promise<{ ok: boolean; error?: string }> {
  return withDb(
    async (db) => {
      const p = await db.package.findFirst({ where: { id, agencyId }, select: { status: true } });
      if (!p) return { ok: false, error: "Not found" };
      if (paused && p.status !== "APPROVED")
        return { ok: false, error: "Only an approved package can be paused." };
      if (!paused && p.status !== "PAUSED")
        return { ok: false, error: "Package is not paused." };
      await db.package.update({ where: { id }, data: { status: paused ? "PAUSED" : "APPROVED" } });
      return { ok: true };
    },
    () => {
      const p = memPackages.find((x) => x.id === id && x.agencyId === agencyId);
      if (!p) return { ok: false, error: "Not found" };
      if (paused && p.status !== "APPROVED")
        return { ok: false, error: "Only an approved package can be paused." };
      if (!paused && p.status !== "PAUSED") return { ok: false, error: "Package is not paused." };
      p.status = paused ? "PAUSED" : "APPROVED";
      return { ok: true };
    },
  );
}

export function deleteAgencyPackage(agencyId: string, id: string): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.package.deleteMany({ where: { id, agencyId } });
      return res.count > 0;
    },
    () => {
      const i = memPackages.findIndex((x) => x.id === id && x.agencyId === agencyId);
      if (i === -1) return false;
      memPackages.splice(i, 1);
      return true;
    },
  );
}

// ---------------------------------------------------------------------------
// Admin moderation
// ---------------------------------------------------------------------------

export function adminListPackages(status?: PackageStatus): Promise<AdminPackage[]> {
  return withDb(
    async (db) => {
      const rows = await db.package.findMany({
        where: status ? { status } : {},
        include: FULL_INCLUDE,
        orderBy: [{ createdAt: "desc" }],
      });
      return rows.map((r) => rowToAdmin(r as PkgRow));
    },
    () =>
      memPackages
        .filter((p) => !status || p.status === status)
        .sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO))
        .map(memToAdmin),
  );
}

export type AdminPackageAction =
  | "approve"
  | "reject"
  | "hide"
  | "feature"
  | "unfeature"
  | "popular"
  | "unpopular";

export function adminPackageAction(
  id: string,
  action: AdminPackageAction,
): Promise<{ ok: boolean; error?: string }> {
  const statusFor: Partial<Record<AdminPackageAction, PackageStatus>> = {
    approve: "APPROVED",
    reject: "REJECTED",
    hide: "HIDDEN",
  };
  return withDb(
    async (db) => {
      const p = await db.package.findUnique({ where: { id }, select: { id: true } });
      if (!p) return { ok: false, error: "Not found" };
      if (action === "feature" || action === "unfeature") {
        await db.package.update({ where: { id }, data: { featured: action === "feature" } });
      } else if (action === "popular" || action === "unpopular") {
        await db.package.update({ where: { id }, data: { popular: action === "popular" } });
      } else {
        await db.package.update({ where: { id }, data: { status: statusFor[action] } });
      }
      return { ok: true };
    },
    () => {
      const p = memPackages.find((x) => x.id === id);
      if (!p) return { ok: false, error: "Not found" };
      if (action === "feature" || action === "unfeature") p.featured = action === "feature";
      else if (action === "popular" || action === "unpopular") p.popular = action === "popular";
      else p.status = statusFor[action]!;
      return { ok: true };
    },
  );
}

export function adminSetPackageOrder(id: string, order: number): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.package.update({ where: { id }, data: { order } }).catch(() => null);
      return res != null;
    },
    () => {
      const p = memPackages.find((x) => x.id === id);
      if (!p) return false;
      p.order = order;
      return true;
    },
  );
}

/** Count of packages by status — admin dashboard tiles. */
export function packageStatusCounts(): Promise<Record<PackageStatus, number>> {
  const empty: Record<PackageStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    HIDDEN: 0,
    PAUSED: 0,
  };
  return withDb(
    async (db) => {
      const grouped = await db.package.groupBy({ by: ["status"], _count: true });
      const out = { ...empty };
      for (const row of grouped) out[row.status as PackageStatus] = row._count;
      return out;
    },
    () => {
      const out = { ...empty };
      for (const p of memPackages) out[p.status]++;
      return out;
    },
  );
}

// ---------------------------------------------------------------------------
// Small helper: destination meta for the memory fallback
// ---------------------------------------------------------------------------

async function destMeta(
  destinationId: string,
): Promise<{ slug: string; name: string; heroImage: string }> {
  const { getDestinationById } = await import("./destination-repo");
  const d = await getDestinationById(destinationId);
  return d
    ? { slug: d.slug, name: d.name, heroImage: d.heroImage }
    : { slug: "", name: "", heroImage: "" };
}
