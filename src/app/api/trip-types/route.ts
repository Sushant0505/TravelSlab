import { NextResponse } from "next/server";
import { listPublicTripTypes } from "@/server/trip-type-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: active trip types for the mega menu, homepage tabs + package forms. */
export async function GET() {
  const types = await listPublicTripTypes();
  return NextResponse.json({ types });
}
