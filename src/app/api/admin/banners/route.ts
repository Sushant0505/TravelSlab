import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminListBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  seedDefaultBanners,
} from "@/server/banner-repo";

export const runtime = "nodejs";

// (ADMIN role enforced by middleware for all /api/admin/** routes.)

// An image is either a remote URL or an uploaded data-URL (auto-resized
// client-side, so the cap is generous but bounded to protect the DB/payload).
const imageRef = z
  .string()
  .max(3_000_000)
  .refine(
    (v) =>
      /^https?:\/\//i.test(v) ||
      /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v),
    "Must be an image URL or an uploaded image",
  );

// Base shape — text fields are optional here; per-kind requirements are
// enforced by the create refinement below.
const bannerBase = z.object({
  kind: z.enum(["composed", "image"]).default("composed"),
  imageUrl: z.union([imageRef, z.literal("")]).default(""),
  eyebrow: z.string().trim().max(80).default(""),
  title: z.string().trim().max(120).default(""),
  accent: z.string().trim().max(40).default(""),
  subtitle: z.string().trim().max(200).default(""),
  discount: z.string().trim().max(80).default(""),
  cta: z.string().trim().max(40).default(""),
  href: z.string().trim().max(300).default(""),
  theme: z.string().trim().min(1).max(30).default("emerald"),
  images: z.array(imageRef).max(3).default([]),
  active: z.boolean().default(true),
  order: z.number().int().min(0).max(999).default(0),
});

const createSchema = bannerBase.superRefine((v, ctx) => {
  if (v.kind === "image") {
    if (!v.imageUrl)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imageUrl"],
        message: "Upload a banner image",
      });
  } else if (!v.title) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["title"],
      message: "Title is required",
    });
  }
});

export async function GET() {
  return NextResponse.json({ ok: true, banners: await adminListBanners() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // "Load starter banners" helper.
  if (body?.action === "seed") {
    return NextResponse.json({ ok: true, banners: await seedDefaultBanners() });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid banner", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const banner = await createBanner(parsed.data);
  return NextResponse.json({ ok: true, banner }, { status: 201 });
}

const patchSchema = bannerBase.partial().extend({ id: z.string().min(1) });

export async function PATCH(req: NextRequest) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const { id, ...patch } = parsed.data;
  const banner = await updateBanner(id, patch);
  if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });
  return NextResponse.json({ ok: true, banner });
}

export async function DELETE(req: NextRequest) {
  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const ok = await deleteBanner(parsed.data.id);
  if (!ok) return NextResponse.json({ error: "Banner not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
