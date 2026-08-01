import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminListTripTypes,
  createTripType,
  updateTripType,
  patchTripType,
  deleteTripType,
} from "@/server/trip-type-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().max(60).optional(),
  subtitle: z.string().trim().max(120).optional(),
  icon: z.string().trim().max(40).optional(),
  active: z.boolean().optional(),
});

const patchSchema = z.object({
  active: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export async function GET() {
  const types = await adminListTripTypes();
  return NextResponse.json({ types });
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
    if (action === "create") {
      const type = await createTripType(parsed.data);
      return NextResponse.json({ ok: true, type }, { status: 201 });
    }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const type = await updateTripType(String(body.id), parsed.data);
    return type
      ? NextResponse.json({ ok: true, type })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "patch") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const parsed = patchSchema.safeParse(body.patch ?? {});
    if (!parsed.success) return NextResponse.json({ error: "Invalid patch" }, { status: 422 });
    const ok = await patchTripType(String(body.id), parsed.data);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "delete") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const ok = await deleteTripType(String(body.id));
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
