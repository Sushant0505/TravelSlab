import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTravelerTrips } from "@/server/traveler-repo";

export const runtime = "nodejs";

/** GET /api/traveler/trips — the signed-in traveler's submitted trips. */
export async function GET() {
  const session = await getSession();
  if (session?.role !== "TRAVELER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, trips: await listTravelerTrips(session.id) });
}
