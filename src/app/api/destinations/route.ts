import { NextResponse } from "next/server";
import { listPublicDestinations } from "@/server/destination-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: PUBLISHED destinations for the homepage grid + mega menu. */
export async function GET() {
  const destinations = await listPublicDestinations();
  return NextResponse.json({ destinations });
}
