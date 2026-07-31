import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getAgencyProfile,
  updateAgencyProfile,
  agencyPhoneExists,
  getAgencyPasswordHash,
  updateAgencyPassword,
} from "@/server/agency-auth-repo";
import { hashPassword, verifyPassword } from "@/lib/agency-auth";

export const runtime = "nodejs";

// AGENCY role enforced by middleware; we read the id to scope to self.
async function agencyId(): Promise<string | null> {
  const s = await getSession();
  return s?.role === "AGENCY" ? s.id : null;
}

export async function GET() {
  const id = await agencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getAgencyProfile(id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, profile });
}

const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(120),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone"),
  gstNumber: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || gstRegex.test(v), "Invalid GST number"),
  city: z.string().trim().max(80).optional(),
});

export async function PATCH(req: NextRequest) {
  const id = await agencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = profileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  if (await agencyPhoneExists(parsed.data.phone, id)) {
    return NextResponse.json(
      { error: "This phone number is already used by another agency." },
      { status: 409 },
    );
  }

  const profile = await updateAgencyProfile(id, {
    name: parsed.data.name,
    ownerName: parsed.data.ownerName,
    phone: parsed.data.phone,
    gstNumber: parsed.data.gstNumber ?? "",
    city: parsed.data.city ?? "",
  });
  return NextResponse.json({ ok: true, profile });
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  const id = await agencyId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = passwordSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 },
    );
  }

  const hash = await getAgencyPasswordHash(id);
  if (!hash || !(await verifyPassword(parsed.data.currentPassword, hash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  await updateAgencyPassword(id, await hashPassword(parsed.data.newPassword));
  return NextResponse.json({ ok: true });
}
