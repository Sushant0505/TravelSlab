import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeResetToken, updateAgencyPassword } from "@/server/agency-auth-repo";
import { hashPassword, sha256 } from "@/lib/agency-auth";

export const runtime = "nodejs";

const schema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/agency/reset-password — set a new password from a reset link.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 },
    );
  }

  const agencyId = await consumeResetToken(sha256(parsed.data.token));
  if (!agencyId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Please request a new one." },
      { status: 400 },
    );
  }

  await updateAgencyPassword(agencyId, await hashPassword(parsed.data.password));
  return NextResponse.json({ ok: true });
}
