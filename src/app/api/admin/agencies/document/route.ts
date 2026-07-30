import { NextRequest, NextResponse } from "next/server";
import { getAgencyDocument } from "@/server/admin-repo";
import { dataUrlToResponse } from "@/server/kyc-file";

export const runtime = "nodejs";

// ADMIN role is enforced by middleware for all /api/admin/** routes.

/**
 * GET /api/admin/agencies/document?agencyId=..&docId=..
 * Streams one agency KYC document inline for the admin verification viewer.
 */
export async function GET(req: NextRequest) {
  const agencyId = req.nextUrl.searchParams.get("agencyId");
  const docId = req.nextUrl.searchParams.get("docId");
  if (!agencyId || !docId) {
    return NextResponse.json({ error: "Missing agencyId or docId" }, { status: 400 });
  }
  const doc = await getAgencyDocument(agencyId, docId);
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return dataUrlToResponse(doc);
}
