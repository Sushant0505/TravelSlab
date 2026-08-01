import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/server/destination-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: full destination record (incl. FAQs + reviews) for the edit form. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const destination = await getDestinationById(id);
  if (!destination) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ destination });
}
