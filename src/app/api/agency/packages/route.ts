import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  listAgencyPackages,
  getAgencyPackage,
  createAgencyPackage,
  updateAgencyPackage,
  setAgencyPackagePaused,
  deleteAgencyPackage,
  type PackageInput,
} from "@/server/package-repo";
import { notifyPackageSubmitted } from "@/server/notify-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function agency(): Promise<{ id: string; name: string } | null> {
  const s = await getSession();
  return s?.role === "AGENCY" ? { id: s.id, name: s.name } : null;
}

const itinSchema = z.object({
  day: z.coerce.number().int().min(1).max(60),
  title: z.string().trim().min(1).max(160),
  detail: z.string().trim().max(2000).default(""),
});

const pkgSchema = z.object({
  name: z.string().trim().min(3).max(120),
  destinationId: z.string().trim().min(1),
  duration: z.string().trim().min(1).max(40),
  durationDays: z.coerce.number().int().min(0).max(120).default(0),
  price: z.coerce.number().int().min(0).max(10_000_000),
  slabId: z.string().trim().nullable().optional(),
  slabLabel: z.string().trim().max(60).nullable().optional(),
  typeId: z.string().trim().nullable().optional(),
  typeLabel: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().min(1).max(6000),
  inclusions: z.array(z.string().trim().min(1)).max(40).default([]),
  exclusions: z.array(z.string().trim().min(1)).max(40).default([]),
  highlights: z.array(z.string().trim().min(1)).max(40).default([]),
  itinerary: z.array(itinSchema).max(60).default([]),
  maxTravelers: z.coerce.number().int().min(0).max(1000).default(0),
  images: z.array(z.string()).max(12).default([]),
  dates: z.array(z.string()).max(60).default([]),
});

function toInput(data: z.infer<typeof pkgSchema>): PackageInput {
  return {
    name: data.name,
    destinationId: data.destinationId,
    duration: data.duration,
    durationDays: data.durationDays,
    price: data.price,
    slabId: data.slabId ?? null,
    slabLabel: data.slabLabel ?? null,
    typeId: data.typeId ?? null,
    typeLabel: data.typeLabel ?? null,
    description: data.description,
    inclusions: data.inclusions,
    exclusions: data.exclusions,
    highlights: data.highlights,
    itinerary: data.itinerary,
    maxTravelers: data.maxTravelers,
    images: data.images,
    dates: data.dates,
  };
}

export async function GET(req: NextRequest) {
  const a = await agency();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const pkg = await getAgencyPackage(a.id, id);
    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ package: pkg });
  }
  const packages = await listAgencyPackages(a.id);
  return NextResponse.json({ packages });
}

export async function POST(req: NextRequest) {
  const a = await agency();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = pkgSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const pkg = await createAgencyPackage(a.id, a.name, toInput(parsed.data));
  await notifyPackageSubmitted(a.name, pkg.name);
  return NextResponse.json({ ok: true, package: pkg }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const a = await agency();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const parsed = pkgSchema.safeParse(body.input);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const pkg = await updateAgencyPackage(a.id, String(body.id), toInput(parsed.data));
  if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, package: pkg });
}

export async function PATCH(req: NextRequest) {
  const a = await agency();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const res = await setAgencyPackagePaused(a.id, String(body.id), Boolean(body.paused));
  return res.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: res.error ?? "Failed" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const a = await agency();
  if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await deleteAgencyPackage(a.id, String(body.id));
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
