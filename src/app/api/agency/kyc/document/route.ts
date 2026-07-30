import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAgencyDocument } from "@/server/admin-repo";
import { dataUrlToResponse } from "@/server/kyc-file";

export const runtime = "nodejs";

/**
 * GET /api/agency/kyc/document?docId=..
 * Streams one of the *logged-in agency's own* KYC documents inline.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const docId = req.nextUrl.searchParams.get("docId");
  if (!docId) return NextResponse.json({ error: "Missing docId" }, { status: 400 });

  const doc = await getAgencyDocument(session.id, docId);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return dataUrlToResponse(doc);
}
