import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
});

/**
 * Verify an OTP. Compare against the hashed code stored in Redis.
 * Stub: accepts "123456" in development.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  // const stored = await redis.get(`otp:${parsed.data.mobile}`);
  // const valid = stored && verifyHash(parsed.data.otp, stored);
  const valid =
    process.env.NODE_ENV === "development"
      ? parsed.data.otp === "123456"
      : false;

  if (!valid) {
    return NextResponse.json({ ok: false, error: "Wrong OTP" }, { status: 401 });
  }

  // await redis.del(`otp:${parsed.data.mobile}`);
  return NextResponse.json({ ok: true, verified: true });
}
