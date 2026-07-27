import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// GET /api/auth/session — the current session, or null.
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}
