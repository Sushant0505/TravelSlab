import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findTravelerByIdentifier } from "@/server/traveler-repo";
import { createOtp, canSendOtp, otpMockMode, maskMobile } from "@/lib/otp";

export const runtime = "nodejs";

const schema = z.object({
  identifier: z.string().trim().min(3), // email or mobile
});

/**
 * POST /api/auth/traveler/request-otp — passwordless login step 1.
 * Resolves the account by email/mobile and sends an OTP to its mobile.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email or mobile" }, { status: 422 });
  }

  const account = await findTravelerByIdentifier(parsed.data.identifier);
  if (!account) {
    return NextResponse.json(
      { error: "No account found for that email or mobile. Plan a trip to get started." },
      { status: 404 },
    );
  }

  const rl = await canSendOtp(account.mobile);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many code requests. Try again in ${Math.ceil((rl.retryAfter ?? 60) / 60)} min.` },
      { status: 429 },
    );
  }

  const code = await createOtp(account.mobile);
  const mock = otpMockMode();
  // TODO(auth-hardening): when MSG91_AUTH_KEY is set, send `code` via MSG91.

  return NextResponse.json({
    ok: true,
    mock,
    mobile: maskMobile(account.mobile),
    ...(mock ? { otp: code } : {}),
  });
}
