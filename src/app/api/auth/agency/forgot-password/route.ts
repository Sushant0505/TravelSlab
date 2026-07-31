import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findAgencyAuthByEmail, createResetToken } from "@/server/agency-auth-repo";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/agency-auth";
import { checkAuthRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ email: z.string().email() });

/** No email provider wired yet → return the link so it can be shown on screen. */
function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);
}

/**
 * POST /api/auth/agency/forgot-password — issue a one-time reset link.
 * Always responds ok (never reveals whether an email exists). In mock mode the
 * link is returned so it can be displayed; in production it would be emailed.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a valid email" }, { status: 422 });

  const email = parsed.data.email.trim().toLowerCase();

  const rl = await checkAuthRateLimit(`agency-forgot:${email}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const agency = await findAgencyAuthByEmail(email);
  let resetUrl: string | undefined;

  if (agency) {
    const { token, tokenHash } = generateResetToken();
    await createResetToken(agency.id, tokenHash, new Date(Date.now() + RESET_TOKEN_TTL_MS));
    const link = `${req.nextUrl.origin}/agencies/reset-password?token=${token}`;
    if (emailConfigured()) {
      // TODO: send `link` to agency.email via the configured provider.
    } else {
      resetUrl = link; // mock mode — shown on the page
    }
  }

  return NextResponse.json({
    ok: true,
    mock: !emailConfigured(),
    ...(resetUrl ? { resetUrl } : {}),
  });
}
