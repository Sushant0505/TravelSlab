/**
 * Destination repository — admin-managed travel destinations.
 *
 * Homepage cards and the /destinations/[slug] pages read from here. Uses
 * Prisma/Postgres when configured (auto-seeded from the built-in catalogue on
 * first use, exactly like `tier-repo`), otherwise an in-memory fallback.
 *
 * Nothing here exposes agency data — that lives in `package-repo`.
 */

import type { PrismaClient } from "@prisma/client";
import { withDb } from "@/lib/persistence";
import { DESTINATIONS as CATALOGUE } from "@/lib/destinations";
import { slugify } from "@/lib/utils";

export type DestinationStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export interface DestinationFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface DestinationReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAtISO: string;
}

export interface DestinationRecord {
  id: string;
  slug: string;
  name: string;
  region: string;
  scope: "India" | "World";
  heroImage: string;
  gallery: string[];
  description: string;
  bestTime: string;
  idealDuration: string;
  highlights: string[];
  tags: string[];
  startingFrom: number;
  status: DestinationStatus;
  featured: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
  createdAtISO: string;
  faqs: DestinationFaq[];
  reviews: DestinationReview[];
}

/** Card-sized projection (omits faqs/reviews) for lists. */
export type DestinationSummary = Omit<DestinationRecord, "faqs" | "reviews">;

export interface DestinationInput {
  name: string;
  slug?: string;
  region: string;
  scope: "India" | "World";
  heroImage: string;
  gallery: string[];
  description: string;
  bestTime: string;
  idealDuration: string;
  highlights: string[];
  tags: string[];
  startingFrom: number;
  status: DestinationStatus;
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  faqs?: { question: string; answer: string }[];
  reviews?: { author: string; rating: number; comment: string }[];
}

// ---------------------------------------------------------------------------
// Seed data from the built-in catalogue
// ---------------------------------------------------------------------------

/** Three evergreen, factual FAQs derived from the destination's own fields. */
function seedFaqs(d: (typeof CATALOGUE)[number]): { question: string; answer: string }[] {
  return [
    {
      question: `What is the best time to visit ${d.name}?`,
      answer: `The ideal window for ${d.name} is ${d.bestTime}. Agencies on TripSlab tailor departures around this season.`,
    },
    {
      question: `How many days do I need for ${d.name}?`,
      answer: `We recommend ${d.idealDays} to cover the highlights of ${d.name} comfortably.`,
    },
    {
      question: `How does planning a ${d.name} trip on TripSlab work?`,
      answer: `Tell us your dates, budget and group size. Verified agencies then send you tailored ${d.name} itineraries to compare — it's free for travellers.`,
    },
  ];
}

function catalogueToInput(d: (typeof CATALOGUE)[number]): DestinationInput {
  return {
    name: d.name,
    slug: d.slug,
    region: d.region,
    scope: d.scope,
    heroImage: d.image,
    gallery: [d.image],
    description: d.brief,
    bestTime: d.bestTime,
    idealDuration: d.idealDays,
    highlights: d.highlights,
    tags: d.knownFor,
    startingFrom: d.startingFrom,
    status: "PUBLISHED",
    featured: Boolean(d.trending),
    seoTitle: `${d.name} Trips — Plan Your ${d.name} Trip | TripSlab`,
    seoDescription: d.brief,
    faqs: seedFaqs(d),
    reviews: [],
  };
}

function seedRecords(): DestinationRecord[] {
  return CATALOGUE.map((d, i) => {
    const input = catalogueToInput(d);
    return {
      id: `dest_${d.slug}`,
      slug: d.slug,
      name: input.name,
      region: input.region,
      scope: input.scope,
      heroImage: input.heroImage,
      gallery: input.gallery,
      description: input.description,
      bestTime: input.bestTime,
      idealDuration: input.idealDuration,
      highlights: input.highlights,
      tags: input.tags,
      startingFrom: input.startingFrom,
      status: input.status,
      featured: input.featured,
      order: i,
      seoTitle: input.seoTitle ?? "",
      seoDescription: input.seoDescription ?? "",
      createdAtISO: new Date().toISOString(),
      faqs: (input.faqs ?? []).map((f, fi) => ({
        id: `faq_${d.slug}_${fi}`,
        question: f.question,
        answer: f.answer,
        order: fi,
      })),
      reviews: [],
    };
  });
}

const g = globalThis as unknown as { __destinations?: DestinationRecord[] };
const memDestinations = g.__destinations ?? (g.__destinations = seedRecords());

// ---------------------------------------------------------------------------
// Prisma include / mappers
// ---------------------------------------------------------------------------

const FULL_INCLUDE = {
  faqs: { orderBy: { order: "asc" } },
  reviews: { orderBy: { createdAt: "desc" } },
} as const;

type FaqRow = { id: string; question: string; answer: string; order: number };
type ReviewRow = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: Date;
};
type DestRow = {
  id: string;
  slug: string;
  name: string;
  region: string;
  scope: string;
  heroImage: string;
  gallery: string[];
  description: string;
  bestTime: string;
  idealDuration: string;
  highlights: string[];
  tags: string[];
  startingFrom: number;
  status: DestinationStatus;
  featured: boolean;
  order: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  faqs?: FaqRow[];
  reviews?: ReviewRow[];
};

function rowToRecord(r: DestRow): DestinationRecord {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    region: r.region,
    scope: r.scope === "World" ? "World" : "India",
    heroImage: r.heroImage,
    gallery: r.gallery,
    description: r.description,
    bestTime: r.bestTime,
    idealDuration: r.idealDuration,
    highlights: r.highlights,
    tags: r.tags,
    startingFrom: r.startingFrom,
    status: r.status,
    featured: r.featured,
    order: r.order,
    seoTitle: r.seoTitle ?? "",
    seoDescription: r.seoDescription ?? "",
    createdAtISO: r.createdAt.toISOString(),
    faqs: (r.faqs ?? []).map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      order: f.order,
    })),
    reviews: (r.reviews ?? []).map((rv) => ({
      id: rv.id,
      author: rv.author,
      rating: rv.rating,
      comment: rv.comment,
      createdAtISO: rv.createdAt.toISOString(),
    })),
  };
}

function toSummary(r: DestinationRecord): DestinationSummary {
  const { faqs: _f, reviews: _rv, ...rest } = r;
  return rest;
}

/** Seed the table from the catalogue on first use (mirrors tier-repo). */
async function ensureDestinations(db: PrismaClient): Promise<void> {
  const count = await db.destination.count();
  if (count > 0) return;
  for (let i = 0; i < CATALOGUE.length; i++) {
    const input = catalogueToInput(CATALOGUE[i]);
    await db.destination.create({
      data: {
        slug: input.slug ?? slugify(input.name),
        name: input.name,
        region: input.region,
        scope: input.scope,
        heroImage: input.heroImage,
        gallery: input.gallery,
        description: input.description,
        bestTime: input.bestTime,
        idealDuration: input.idealDuration,
        highlights: input.highlights,
        tags: input.tags,
        startingFrom: input.startingFrom,
        status: input.status,
        featured: input.featured,
        order: i,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        faqs: { create: (input.faqs ?? []).map((f, fi) => ({ ...f, order: fi })) },
      },
    });
  }
}

const cmpDisplay = (a: DestinationSummary, b: DestinationSummary) =>
  Number(b.featured) - Number(a.featured) || a.order - b.order || a.name.localeCompare(b.name);

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

/** PUBLISHED destinations for the homepage / mega-menu, display-ordered. */
export function listPublicDestinations(): Promise<DestinationSummary[]> {
  return withDb(
    async (db) => {
      await ensureDestinations(db);
      const rows = await db.destination.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
      });
      return rows.map((r) => toSummary(rowToRecord(r as DestRow)));
    },
    () =>
      memDestinations
        .filter((d) => d.status === "PUBLISHED")
        .map(toSummary)
        .sort(cmpDisplay),
  );
}

export function getPublicDestinationBySlug(
  slug: string,
): Promise<DestinationRecord | null> {
  return withDb(
    async (db) => {
      await ensureDestinations(db);
      const r = await db.destination.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: FULL_INCLUDE,
      });
      return r ? rowToRecord(r as DestRow) : null;
    },
    () => memDestinations.find((d) => d.slug === slug && d.status === "PUBLISHED") ?? null,
  );
}

/** Slugs of every PUBLISHED destination — for sitemap / static params. */
export function listPublicDestinationSlugs(): Promise<string[]> {
  return withDb(
    async (db) => {
      await ensureDestinations(db);
      const rows = await db.destination.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    },
    () => memDestinations.filter((d) => d.status === "PUBLISHED").map((d) => d.slug),
  );
}

// ---------------------------------------------------------------------------
// Admin reads + writes
// ---------------------------------------------------------------------------

export function adminListDestinations(): Promise<DestinationSummary[]> {
  return withDb(
    async (db) => {
      await ensureDestinations(db);
      const rows = await db.destination.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
      return rows.map((r) => toSummary(rowToRecord(r as DestRow)));
    },
    () =>
      memDestinations
        .map(toSummary)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  );
}

export function getDestinationById(id: string): Promise<DestinationRecord | null> {
  return withDb(
    async (db) => {
      const r = await db.destination.findUnique({ where: { id }, include: FULL_INCLUDE });
      return r ? rowToRecord(r as DestRow) : null;
    },
    () => memDestinations.find((d) => d.id === id) ?? null,
  );
}

async function uniqueSlug(
  db: PrismaClient,
  base: string,
  exceptId?: string,
): Promise<string> {
  const root = slugify(base) || "destination";
  let slug = root;
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await db.destination.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${root}-${n++}`;
  }
}

function memUniqueSlug(base: string, exceptId?: string): string {
  const root = slugify(base) || "destination";
  let slug = root;
  let n = 2;
  while (memDestinations.some((d) => d.slug === slug && d.id !== exceptId)) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

export function createDestination(input: DestinationInput): Promise<DestinationRecord> {
  return withDb(
    async (db) => {
      const slug = await uniqueSlug(db, input.slug || input.name);
      const max = await db.destination.aggregate({ _max: { order: true } });
      const order = (max._max.order ?? -1) + 1;
      const r = await db.destination.create({
        data: {
          slug,
          name: input.name,
          region: input.region,
          scope: input.scope,
          heroImage: input.heroImage,
          gallery: input.gallery,
          description: input.description,
          bestTime: input.bestTime,
          idealDuration: input.idealDuration,
          highlights: input.highlights,
          tags: input.tags,
          startingFrom: input.startingFrom,
          status: input.status,
          featured: input.featured,
          order,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          faqs: { create: (input.faqs ?? []).map((f, i) => ({ ...f, order: i })) },
          reviews: { create: input.reviews ?? [] },
        },
        include: FULL_INCLUDE,
      });
      return rowToRecord(r as DestRow);
    },
    () => {
      const slug = memUniqueSlug(input.slug || input.name);
      const order = memDestinations.reduce((m, d) => Math.max(m, d.order), -1) + 1;
      const rec: DestinationRecord = {
        id: `dest_${Date.now().toString(36)}`,
        slug,
        name: input.name,
        region: input.region,
        scope: input.scope,
        heroImage: input.heroImage,
        gallery: input.gallery,
        description: input.description,
        bestTime: input.bestTime,
        idealDuration: input.idealDuration,
        highlights: input.highlights,
        tags: input.tags,
        startingFrom: input.startingFrom,
        status: input.status,
        featured: input.featured,
        order,
        seoTitle: input.seoTitle ?? "",
        seoDescription: input.seoDescription ?? "",
        createdAtISO: new Date().toISOString(),
        faqs: (input.faqs ?? []).map((f, i) => ({ id: `faq_${i}_${Date.now()}`, ...f, order: i })),
        reviews: (input.reviews ?? []).map((rv, i) => ({
          id: `rev_${i}_${Date.now()}`,
          ...rv,
          createdAtISO: new Date().toISOString(),
        })),
      };
      memDestinations.push(rec);
      return rec;
    },
  );
}

export function updateDestination(
  id: string,
  input: DestinationInput,
): Promise<DestinationRecord | null> {
  return withDb(
    async (db) => {
      const existing = await db.destination.findUnique({ where: { id } });
      if (!existing) return null;
      const slug = input.slug
        ? await uniqueSlug(db, input.slug, id)
        : existing.slug;
      // FAQs/reviews are edited replace-all from the admin form.
      await db.destinationFAQ.deleteMany({ where: { destinationId: id } });
      await db.destinationReview.deleteMany({ where: { destinationId: id } });
      const r = await db.destination.update({
        where: { id },
        data: {
          slug,
          name: input.name,
          region: input.region,
          scope: input.scope,
          heroImage: input.heroImage,
          gallery: input.gallery,
          description: input.description,
          bestTime: input.bestTime,
          idealDuration: input.idealDuration,
          highlights: input.highlights,
          tags: input.tags,
          startingFrom: input.startingFrom,
          status: input.status,
          featured: input.featured,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          faqs: { create: (input.faqs ?? []).map((f, i) => ({ ...f, order: i })) },
          reviews: { create: input.reviews ?? [] },
        },
        include: FULL_INCLUDE,
      });
      return rowToRecord(r as DestRow);
    },
    () => {
      const d = memDestinations.find((x) => x.id === id);
      if (!d) return null;
      Object.assign(d, {
        slug: input.slug ? memUniqueSlug(input.slug, id) : d.slug,
        name: input.name,
        region: input.region,
        scope: input.scope,
        heroImage: input.heroImage,
        gallery: input.gallery,
        description: input.description,
        bestTime: input.bestTime,
        idealDuration: input.idealDuration,
        highlights: input.highlights,
        tags: input.tags,
        startingFrom: input.startingFrom,
        status: input.status,
        featured: input.featured,
        seoTitle: input.seoTitle ?? "",
        seoDescription: input.seoDescription ?? "",
        faqs: (input.faqs ?? []).map((f, i) => ({ id: `faq_${i}_${Date.now()}`, ...f, order: i })),
        reviews: (input.reviews ?? []).map((rv, i) => ({
          id: `rev_${i}_${Date.now()}`,
          ...rv,
          createdAtISO: new Date().toISOString(),
        })),
      });
      return d;
    },
  );
}

export type DestinationPatch = Partial<
  Pick<DestinationRecord, "status" | "featured" | "order">
>;

/** Lightweight field update for hide / feature / reorder toggles. */
export function patchDestination(
  id: string,
  patch: DestinationPatch,
): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.destination
        .update({ where: { id }, data: patch })
        .catch(() => null);
      return res != null;
    },
    () => {
      const d = memDestinations.find((x) => x.id === id);
      if (!d) return false;
      Object.assign(d, patch);
      return true;
    },
  );
}

export function deleteDestination(id: string): Promise<boolean> {
  return withDb(
    async (db) => {
      const res = await db.destination.deleteMany({ where: { id } });
      return res.count > 0;
    },
    () => {
      const i = memDestinations.findIndex((x) => x.id === id);
      if (i === -1) return false;
      memDestinations.splice(i, 1);
      return true;
    },
  );
}

/** Lightweight {id,name,slug} list for select menus (agency package form). */
export function listDestinationOptions(): Promise<
  { id: string; name: string; slug: string }[]
> {
  return withDb(
    async (db) => {
      await ensureDestinations(db);
      const rows = await db.destination.findMany({
        where: { status: { not: "HIDDEN" } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      });
      return rows;
    },
    () =>
      memDestinations
        .filter((d) => d.status !== "HIDDEN")
        .map((d) => ({ id: d.id, name: d.name, slug: d.slug }))
        .sort((a, b) => a.name.localeCompare(b.name)),
  );
}
