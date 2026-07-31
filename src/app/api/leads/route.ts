import { NextRequest, NextResponse } from "next/server";
import { leadSchema, scoreLead } from "@/lib/lead";
import { assignSlab } from "@/lib/slabs";
import { checkLeadRateLimit } from "@/lib/rate-limit";
import { notifyNewLead, notifySuspicious } from "@/server/notify-repo";
import { appendLead } from "@/server/lead-repo";
import { resolveTier } from "@/server/tier-repo";
import { findOrCreateTraveler, getTravelerAccount } from "@/server/traveler-repo";
import { verifyOtp } from "@/lib/otp";
import {
  getSession,
  signSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export const runtime = "nodejs";

function makeReference(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return `TS-${s}`;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

/**
 * POST /api/leads — finalize a trip request.
 *
 * OTP-gated + passwordless: verifies the OTP for the mobile FIRST; only then
 * auto-creates (or reuses) the traveler account, creates the lead, and logs the
 * traveler in (sets the session cookie). If the OTP is wrong/expired, no lead is
 * created.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const ip = clientIp(req);

  // --- Abuse prevention: max 3 leads / 24h across IP + mobile + fingerprint ---
  const rate = await checkLeadRateLimit({
    ip,
    mobile: input.mobile,
    fingerprint: input.fingerprint,
  });
  if (!rate.allowed) {
    await notifySuspicious(
      `Lead rate limit hit for mobile ${input.mobile} / IP ${ip}.`,
    );
    return NextResponse.json(
      { error: "Daily lead limit reached. Please try again tomorrow.", limit: rate.limit },
      { status: 429 },
    );
  }

  // --- Verify the OTP BEFORE creating anything (mobile ownership check) -------
  const otp = await verifyOtp(input.mobile, input.otp);
  if (!otp.ok) {
    return NextResponse.json(
      { error: otp.error ?? "OTP verification failed. Please resend and try again." },
      { status: 401 },
    );
  }

  // --- Auto-create / reuse the traveler account (dedupe by email OR mobile) ---
  const session = await getSession();
  let account =
    session?.role === "TRAVELER" ? await getTravelerAccount(session.id) : null;
  if (!account) {
    account = await findOrCreateTraveler({
      name: input.name,
      email: input.email,
      mobile: input.mobile,
    });
  }

  // --- Categorize + score ---
  const perHead =
    input.travelers > 0 ? Math.round(input.budget / input.travelers) : input.budget;
  const slab = assignSlab(perHead);
  const leadScore = scoreLead({
    budget: input.budget,
    travelers: input.travelers,
    travelDate: input.travelDate,
    preferences: input.preferences,
    otpVerified: true,
  });
  const reference = makeReference();

  // --- Persist the lead, linked to the account so it shows in their dashboard -
  const created = await appendLead({
    reference,
    name: input.name,
    email: input.email,
    mobile: input.mobile,
    preferences: input.preferences,
    departureCity: input.departureCity,
    travelDateISO: input.travelDate,
    destination: input.destination,
    tripType: input.tripType,
    travelers: input.travelers,
    budget: input.budget,
    perHead,
    slab: slab.id,
    leadScore,
    otpVerified: true,
    travelerId: account.id,
  });

  // --- Fan out: notify ONLY agencies subscribed to this lead's slab tier ---
  const tier = await resolveTier(perHead);
  const fanout = await notifyNewLead({
    subscriptionKey: tier.id,
    reference,
    destination: input.destination,
    budgetRange: tier.label,
  });

  // --- Log the traveler in (passwordless) ------------------------------------
  const token = await signSession({
    role: "TRAVELER",
    id: account.id,
    name: account.name,
    email: account.email,
  });

  const res = NextResponse.json(
    {
      ok: true,
      reference,
      // Reflect the admin's slab tier (custom ranges), not the fixed band.
      slab: { id: created.slab, label: created.slabLabel, price: created.price },
      perHead,
      leadScore,
      remaining: rate.remaining,
      agenciesNotified: fanout.agenciesNotified,
      loggedIn: true,
    },
    { status: 201 },
  );
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
