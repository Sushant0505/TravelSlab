import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
});

/**
 * Send an OTP to the traveler's mobile.
 * Wire this to MSG91 / Twilio and store the hashed code in Redis with a TTL
 * (OTP_TTL_SECONDS). Returned here as a stub for local development.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mobile" }, { status: 422 });
  }

  // const code = String(Math.floor(100000 + Math.random() * 900000));
  // await redis.set(`otp:${parsed.data.mobile}`, hash(code), "EX", ttl);
  // await sendSms(parsed.data.mobile, `Your TripSlab OTP is ${code}`);

  return NextResponse.json({ ok: true, sent: true });
}
