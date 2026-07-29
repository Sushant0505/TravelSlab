import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listTravelerNotifications,
  markAllReadTraveler,
} from "@/server/notify-repo";

export const runtime = "nodejs";

/** GET /api/traveler/notifications — the traveler's notification feed. */
export async function GET() {
  const session = await getSession();
  if (session?.role !== "TRAVELER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await listTravelerNotifications(session.id);
  return NextResponse.json({ ok: true, items });
}

/** POST /api/traveler/notifications — mark all as read. */
export async function POST() {
  const session = await getSession();
  if (session?.role !== "TRAVELER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await markAllReadTraveler(session.id);
  return NextResponse.json({ ok: true });
}
