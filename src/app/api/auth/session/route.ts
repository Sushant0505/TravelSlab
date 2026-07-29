import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unreadTraveler } from "@/server/notify-repo";

export const runtime = "nodejs";

// GET /api/auth/session — the current session (+ unread count for travelers).
export async function GET() {
  const session = await getSession();
  let unread = 0;
  if (session?.role === "TRAVELER") {
    unread = await unreadTraveler(session.id);
  }
  return NextResponse.json({ session, unread });
}
