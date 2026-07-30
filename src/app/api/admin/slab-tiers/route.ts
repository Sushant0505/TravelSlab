import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  listSlabTiers,
  createSlabTier,
  updateSlabTier,
  deleteSlabTier,
} from "@/server/tier-repo";

export const runtime = "nodejs";

// ADMIN role is enforced by middleware for all /api/admin/** routes.

const tierBase = z.object({
  label: z.string().trim().min(1).max(60),
  minPerHead: z.number().int().min(0).max(100_000_000),
  maxPerHead: z.number().int().min(1).max(100_000_000).nullable(),
  leadPrice: z.number().int().min(0).max(1_000_000),
  autoHide: z.boolean(),
});

const rangeOk = (min?: number, max?: number | null) =>
  typeof min !== "number" || max == null || max > min;

const createSchema = tierBase.refine((v) => rangeOk(v.minPerHead, v.maxPerHead), {
  message: "Upper bound must be greater than the lower bound",
  path: ["maxPerHead"],
});

const patchSchema = tierBase
  .partial()
  .extend({ id: z.string().min(1) })
  .refine((v) => rangeOk(v.minPerHead, v.maxPerHead), {
    message: "Upper bound must be greater than the lower bound",
    path: ["maxPerHead"],
  });

export async function GET() {
  return NextResponse.json({ ok: true, tiers: await listSlabTiers() });
}

export async function POST(req: NextRequest) {
  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid range", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const tier = await createSlabTier(parsed.data);
  return NextResponse.json({ ok: true, tier }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid range", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const { id, ...patch } = parsed.data;
  const tier = await updateSlabTier(id, patch);
  if (!tier) return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  return NextResponse.json({ ok: true, tier });
}

export async function DELETE(req: NextRequest) {
  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const ok = await deleteSlabTier(parsed.data.id);
  if (!ok) return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
