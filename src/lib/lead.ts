import { z } from "zod";
import { assignSlab } from "./slabs";

/** Payload sent from the trip planner to POST /api/leads. */
export const leadSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  destination: z.string().min(2),
  departureCity: z.string().min(2),
  travelers: z.number().int().min(1).max(40),
  budget: z.number().int().min(0),
  travelDate: z.string().min(1),
  tripType: z.string().min(1),
  preferences: z.string().max(2000).optional().default(""),
  // OTP flow
  otp: z.string().length(6).optional(),
  // Anti-abuse signals collected client-side.
  fingerprint: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/**
 * Lead quality score (0–100) shown to agencies in the marketplace.
 * Higher = more likely to convert. Deliberately simple + explainable.
 */
export function scoreLead(input: {
  budget: number;
  travelers: number;
  travelDate: string;
  preferences?: string;
  otpVerified?: boolean;
}): number {
  let score = 40;

  // Verified contact is the single strongest signal.
  if (input.otpVerified) score += 25;

  // Higher budgets convert better for agencies.
  const slab = assignSlab(
    input.travelers > 0 ? input.budget / input.travelers : input.budget,
  );
  const slabBoost: Record<string, number> = {
    s0_5k: 2,
    s5_10k: 6,
    s10_20k: 10,
    s20_50k: 14,
    s50_100k: 16,
    s100k_plus: 18,
  };
  score += slabBoost[slab.id] ?? 0;

  // Concrete near-term dates convert better than "someday".
  const days = daysUntil(input.travelDate);
  if (days !== null) {
    if (days >= 7 && days <= 90) score += 10;
    else if (days > 90 && days <= 180) score += 5;
  }

  // Detail in preferences signals genuine intent.
  if ((input.preferences?.trim().length ?? 0) > 30) score += 5;

  // Group trips are higher value.
  if (input.travelers >= 4) score += 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function daysUntil(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.round((t - Date.now()) / 86_400_000);
}
