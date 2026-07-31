import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { notifyAgencyRegistration } from "@/server/notify-repo";
import { adminCreateAgency } from "@/server/admin-repo";
import { agencyPhoneExists } from "@/server/agency-auth-repo";
import { hashPassword } from "@/lib/agency-auth";
import { kycDocListSchema } from "@/lib/kyc";

export const runtime = "nodejs";

const gstRegex =
  /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

const schema = z
  .object({
    name: z.string().min(2),
    ownerName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    gstNumber: z
      .string()
      .optional()
      .refine((v) => !v || gstRegex.test(v), "Invalid GST number"),
    city: z.string().trim().max(80).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    documents: kycDocListSchema.optional().default([]),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * POST /api/agency/register — create a PENDING agency with its own password.
 * Password is bcrypt-hashed; email + phone must be unique.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // Phone must be unique.
  if (await agencyPhoneExists(input.phone)) {
    return NextResponse.json(
      { error: "This phone number is already registered." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(input.password);

  // adminCreateAgency dedupes by email; `created: false` => email already taken.
  const { created } = await adminCreateAgency({
    name: input.name,
    ownerName: input.ownerName,
    email: input.email,
    phone: input.phone,
    gstNumber: input.gstNumber,
    city: input.city,
    passwordHash,
    documents: input.documents,
  });

  if (!created) {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in." },
      { status: 409 },
    );
  }

  await notifyAgencyRegistration(input.name);

  return NextResponse.json(
    {
      ok: true,
      status: "PENDING",
      message: "Registration submitted — your account is awaiting admin approval.",
    },
    { status: 201 },
  );
}
