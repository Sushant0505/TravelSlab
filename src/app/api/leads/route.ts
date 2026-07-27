import { NextRequest, NextResponse } from "next/server";
import { leadSchema, scoreLead } from "@/lib/lead";
import { assignSlab } from "@/lib/slabs";
import { checkLeadRateLimit } from "@/lib/rate-limit";
import { notifyNewLead, notifySuspicious } from "@/server/notify-repo";
import { appendLead } from "@/server/lead-repo";
// import { prisma } from "@/lib/db"; // enable once your DB is provisioned

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
      {
        error: "Daily lead limit reached. Please try again tomorrow.",
        limit: rate.limit,
      },
      { status: 429 },
    );
  }

  // --- Categorize + score ---
  const perHead =
    input.travelers > 0
      ? Math.round(input.budget / input.travelers)
      : input.budget;
  const slab = assignSlab(perHead);
  const otpVerified = Boolean(input.otp); // wire real OTP verification here
  const leadScore = scoreLead({
    budget: input.budget,
    travelers: input.travelers,
    travelDate: input.travelDate,
    preferences: input.preferences,
    otpVerified,
  });
  const reference = makeReference();

  // --- Persist into the marketplace so agencies can actually see + buy it ---
  // Uses Prisma when a DB is configured, else an in-memory store (see repo).
  await appendLead({
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
    otpVerified,
  });

  // --- Fan out: notify ONLY agencies subscribed to this lead's slab ---
  // e.g. ₹7,500/head -> s5_10k -> only s5_10k subscribers are alerted.
  const fanout = await notifyNewLead({
    slab: slab.id,
    reference,
    destination: input.destination,
    budgetRange: slab.label,
  });

  return NextResponse.json(
    {
      ok: true,
      reference,
      slab: { id: slab.id, label: slab.label, price: slab.leadPrice },
      perHead,
      leadScore,
      remaining: rate.remaining,
      agenciesNotified: fanout.agenciesNotified,
    },
    { status: 201 },
  );
}
