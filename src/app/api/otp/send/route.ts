import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOtp, canSendOtp, otpMockMode } from "@/lib/otp";

export const runtime = "nodejs";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
});

/**
 * Send an OTP to a mobile (trip-planner flow).
 *
 * Mock mode (no MSG91_AUTH_KEY): the code is returned as `otp` so the UI can
 * show it. Rate-limited per mobile.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mobile" }, { status: 422 });
  }

  const rl = await canSendOtp(parsed.data.mobile);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many code requests. Try again in ${Math.ceil((rl.retryAfter ?? 60) / 60)} min.` },
      { status: 429 },
    );
  }

  const code = await createOtp(parsed.data.mobile);
  const mock = otpMockMode();
  if (!mock) {
    // TODO(auth-hardening): send `code` via MSG91 to parsed.data.mobile.
  }

  return NextResponse.json({ ok: true, sent: true, mock, ...(mock ? { otp: code } : {}) });
}
