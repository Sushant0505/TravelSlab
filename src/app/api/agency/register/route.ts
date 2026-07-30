import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyAgencyRegistration } from "@/server/notify-repo";
import { adminCreateAgency } from "@/server/admin-repo";
import { kycDocListSchema } from "@/lib/kyc";

export const runtime = "nodejs";

const gstRegex =
  /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

const schema = z.object({
  name: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  gstNumber: z
    .string()
    .optional()
    .refine((v) => !v || gstRegex.test(v), "Invalid GST number"),
  city: z.string().trim().max(80).optional(),
  documents: kycDocListSchema.optional().default([]),
});

/**
 * POST /api/agency/register — create a PENDING agency awaiting admin approval.
 *
 * Production: hash a temp password / send a magic link, store KYC docs,
 * and create an ADMIN notification. Persisted via Prisma once DB is connected.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Persist the agency as PENDING so it shows up in the admin agencies list.
  // (Swap for `await prisma.agency.create(...)` once the DB is connected.)
  const { created } = await adminCreateAgency({
    name: parsed.data.name,
    ownerName: parsed.data.ownerName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    gstNumber: parsed.data.gstNumber,
    city: parsed.data.city,
    documents: parsed.data.documents,
  });

  // Only ping admins for genuinely new applications, not re-submits.
  if (created) await notifyAgencyRegistration(parsed.data.name);

  return NextResponse.json(
    {
      ok: true,
      status: "PENDING",
      created,
      message: created
        ? "Submitted for admin approval"
        : "An application with this email is already pending",
    },
    { status: created ? 201 : 200 },
  );
}
