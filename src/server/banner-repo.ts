/**
 * Banner repository — powers the home-page promo carousel, managed from the
 * admin console. Prisma/Postgres when configured (see `withDb`), else the
 * in-memory demo list below. Public reads fall back to the built-in starter
 * banners so the home page is never empty.
 */

import { withDb } from "@/lib/persistence";
import { DEFAULT_BANNERS, type BannerDTO } from "@/lib/banners";

export type { BannerDTO };

export type BannerInput = Omit<BannerDTO, "id">;

const g = globalThis as unknown as { __banners?: BannerDTO[] };
const banners =
  g.__banners ?? (g.__banners = DEFAULT_BANNERS.map((b) => ({ ...b, images: [...b.images] })));

function byOrder(a: BannerDTO, b: BannerDTO) {
  return a.order - b.order;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToDTO(r: any): BannerDTO {
  return {
    id: r.id,
    kind: r.kind === "image" ? "image" : "composed",
    imageUrl: r.imageUrl ?? "",
    eyebrow: r.eyebrow,
    title: r.title,
    accent: r.accent,
    subtitle: r.subtitle ?? "",
    discount: r.discount ?? "",
    cta: r.cta,
    href: r.href,
    theme: r.theme,
    images: r.images ?? [],
    active: r.active,
    order: r.order,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function toData(input: BannerInput) {
  return {
    kind: input.kind,
    imageUrl: input.imageUrl || null,
    eyebrow: input.eyebrow,
    title: input.title,
    accent: input.accent,
    subtitle: input.subtitle || null,
    discount: input.discount || null,
    cta: input.cta,
    href: input.href,
    theme: input.theme,
    images: input.images,
    active: input.active,
    order: input.order,
  };
}

// --- Public: active banners for the home carousel ---------------------------

export function listActiveBanners(): Promise<BannerDTO[]> {
  return withDb(
    async (db) => {
      const rows = await db.banner.findMany({
        where: { active: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      // Fresh DB with no banners yet -> show the built-in starters.
      if (rows.length === 0) return DEFAULT_BANNERS.filter((b) => b.active);
      return rows.map(rowToDTO);
    },
    () => banners.filter((b) => b.active).slice().sort(byOrder),
  );
}

// --- Admin: full list + CRUD ------------------------------------------------

export function adminListBanners(): Promise<BannerDTO[]> {
  return withDb(
    async (db) => {
      const rows = await db.banner.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      return rows.map(rowToDTO);
    },
    () => banners.slice().sort(byOrder),
  );
}

export function createBanner(input: BannerInput): Promise<BannerDTO> {
  return withDb(
    async (db) => rowToDTO(await db.banner.create({ data: toData(input) })),
    () => {
      const banner: BannerDTO = { ...input, id: `banner_${Date.now().toString(36)}` };
      banners.push(banner);
      return banner;
    },
  );
}

export function updateBanner(
  id: string,
  patch: Partial<BannerInput>,
): Promise<BannerDTO | null> {
  return withDb(
    async (db) => {
      const existing = await db.banner.findUnique({ where: { id } });
      if (!existing) return null;
      const data = toData({ ...rowToDTO(existing), ...patch } as BannerInput);
      return rowToDTO(await db.banner.update({ where: { id }, data }));
    },
    () => {
      const b = banners.find((x) => x.id === id);
      if (!b) return null;
      Object.assign(b, patch);
      return b;
    },
  );
}

export function deleteBanner(id: string): Promise<boolean> {
  return withDb(
    async (db) => {
      try {
        await db.banner.delete({ where: { id } });
        return true;
      } catch {
        return false;
      }
    },
    () => {
      const i = banners.findIndex((x) => x.id === id);
      if (i === -1) return false;
      banners.splice(i, 1);
      return true;
    },
  );
}

/** One-click "load starter banners" — only seeds when the store is empty. */
export function seedDefaultBanners(): Promise<BannerDTO[]> {
  return withDb(
    async (db) => {
      const count = await db.banner.count();
      if (count === 0) {
        await db.banner.createMany({
          data: DEFAULT_BANNERS.map((b) => toData(b)),
        });
      }
      const rows = await db.banner.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
      return rows.map(rowToDTO);
    },
    () => {
      if (banners.length === 0) {
        banners.push(
          ...DEFAULT_BANNERS.map((b) => ({ ...b, images: [...b.images] })),
        );
      }
      return banners.slice().sort(byOrder);
    },
  );
}
