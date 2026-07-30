import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  listAgencyDocuments,
  addAgencyDocuments,
  deleteAgencyDocument,
} from "@/server/admin-repo";
import { kycDocListSchema, MAX_KYC_DOCS } from "@/lib/kyc";

export const runtime = "nodejs";

// AGENCY role is enforced by middleware; we read the id to scope to self.

export async function GET() {
  const session = await getSession();
  if (session?.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, documents: await listAgencyDocuments(session.id) });
}

const postSchema = z.object({ documents: kycDocListSchema });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid documents", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const current = await listAgencyDocuments(session.id);
  if (current.length + parsed.data.documents.length > MAX_KYC_DOCS) {
    return NextResponse.json(
      { error: `You can keep at most ${MAX_KYC_DOCS} documents on file.` },
      { status: 422 },
    );
  }
  const documents = await addAgencyDocuments(session.id, parsed.data.documents);
  return NextResponse.json({ ok: true, documents }, { status: 201 });
}

const deleteSchema = z.object({ docId: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  const ok = await deleteAgencyDocument(session.id, parsed.data.docId);
  if (!ok) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
