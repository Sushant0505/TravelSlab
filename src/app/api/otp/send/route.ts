import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOtp, otpMockMode } from "@/lib/otp";

export const runtime = "nodejs";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
});

/**
 * Send an OTP to the traveler's mobile.
 *
 * Mock mode (no MSG91_AUTH_KEY): the generated code is returned as `otp` so the
 * UI can show it. To go live, add MSG91_AUTH_KEY and send the SMS here instead
 * of returning the code.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mobile" }, { status: 422 });
  }

  const code = await createOtp(parsed.data.mobile);
  const mock = otpMockMode();

  if (!mock) {
    // TODO(auth-hardening): send `code` via MSG91 to parsed.data.mobile.
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    mock,
    ...(mock ? { otp: code } : {}),
  });
}
