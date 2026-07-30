import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listSlabPricing, setSlabPrice, resetSlabPrice } from "@/server/pricing-repo";

export const runtime = "nodejs";

// ADMIN role is enforced by middleware for all /api/admin/** routes.

const SLAB_IDS = [
  "s0_5k",
  "s5_10k",
  "s10_20k",
  "s20_50k",
  "s50_100k",
  "s100k_plus",
] as const;

export async function GET() {
  return NextResponse.json({ ok: true, pricing: await listSlabPricing() });
}

const schema = z.object({
  slab: z.enum(SLAB_IDS),
  // Absent / null price => reset to the default.
  price: z.number().int().min(0).max(100_000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const { slab, price } = parsed.data;
  if (price === null || price === undefined) {
    await resetSlabPrice(slab);
  } else {
    await setSlabPrice(slab, price);
  }
  return NextResponse.json({ ok: true, pricing: await listSlabPricing() });
}
