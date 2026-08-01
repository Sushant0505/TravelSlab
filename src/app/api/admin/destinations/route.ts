import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminListDestinations,
  createDestination,
  updateDestination,
  patchDestination,
  deleteDestination,
  type DestinationInput,
} from "@/server/destination-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const faqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(2000),
});
const reviewSchema = z.object({
  author: z.string().trim().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
});

const inputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().max(80).optional(),
  region: z.string().trim().min(1).max(120),
  scope: z.enum(["India", "World"]),
  heroImage: z.string().trim().min(1),
  gallery: z.array(z.string()).default([]),
  description: z.string().trim().min(1).max(6000),
  bestTime: z.string().trim().min(1).max(120),
  idealDuration: z.string().trim().min(1).max(60),
  highlights: z.array(z.string().trim().min(1)).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  startingFrom: z.coerce.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  faqs: z.array(faqSchema).default([]),
  reviews: z.array(reviewSchema).default([]),
});

const patchSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional(),
  featured: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export async function GET() {
  const destinations = await adminListDestinations();
  return NextResponse.json({ destinations });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;

  if (action === "create" || action === "update") {
    const parsed = inputSchema.safeParse(body.input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      );
    }
    const input = parsed.data as DestinationInput;
    if (action === "create") {
      const dest = await createDestination(input);
      return NextResponse.json({ ok: true, destination: dest }, { status: 201 });
    }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const dest = await updateDestination(String(body.id), input);
    if (!dest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, destination: dest });
  }

  if (action === "patch") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const parsed = patchSchema.safeParse(body.patch ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Invalid patch" }, { status: 422 });
    const ok = await patchDestination(String(body.id), parsed.data);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "delete") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const ok = await deleteDestination(String(body.id));
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
