import type { SlabId } from "./slabs";

export type LeadStatus =
  | "NEW"
  | "VERIFIED"
  | "AVAILABLE"
  | "SOLD"
  | "HIDDEN"
  | "FRAUD";

/**
 * Full lead as it exists server-side. NEVER send this shape to an agency
 * unless they have paid for the lead.
 */
export interface FullLead {
  id: string;
  reference: string;
  status: LeadStatus;
  // PII — gated behind purchase
  name: string;
  email: string;
  mobile: string;
  preferences: string;
  departureCity: string;
  travelDateISO: string;
  // Public marketplace fields
  destination: string;
  travelers: number;
  budget: number;
  perHead: number;
  slab: SlabId;
  price: number;
  leadScore: number;
  otpVerified: boolean;
  createdAtISO: string;
  /** Agency ids that have already unlocked this lead (non-exclusive). */
  purchasedBy: string[];
}

/**
 * What an agency sees while browsing — no name, phone, email, exact date or
 * free-text preferences. Only enough to decide whether to buy.
 */
export interface MarketplaceLead {
  id: string;
  reference: string;
  destination: string;
  /** Bucketed, e.g. "₹20,000 – ₹50,000". Never the exact figure. */
  budgetRange: string;
  /** Month + year only, e.g. "Sep 2026". Never the exact date. */
  travelMonth: string;
  travelers: number;
  slab: SlabId;
  price: number;
  leadScore: number;
  otpVerified: boolean;
  postedAgoHours: number;
  /** Whether the requesting agency has already unlocked this lead. */
  owned: boolean;
}

/** Contact block revealed only after a successful purchase. */
export interface RevealedContact {
  name: string;
  email: string;
  mobile: string;
  departureCity: string;
  travelDate: string;
  preferences: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function travelMonthOf(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Flexible";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function hoursAgo(iso: string): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.round((Date.now() - t) / 3_600_000));
}

/**
 * Project a full lead down to its safe, public marketplace shape.
 * `ownedByMe` marks whether the requesting agency has already unlocked it.
 */
export function toMarketplaceLead(
  lead: FullLead,
  budgetRange: string,
  ownedByMe = false,
): MarketplaceLead {
  return {
    id: lead.id,
    reference: lead.reference,
    destination: lead.destination,
    budgetRange,
    travelMonth: travelMonthOf(lead.travelDateISO),
    travelers: lead.travelers,
    slab: lead.slab,
    price: lead.price,
    leadScore: lead.leadScore,
    otpVerified: lead.otpVerified,
    postedAgoHours: hoursAgo(lead.createdAtISO),
    owned: ownedByMe,
  };
}

/** Extract the contact block. Only call this after payment is confirmed. */
export function revealContact(lead: FullLead): RevealedContact {
  return {
    name: lead.name,
    email: lead.email,
    mobile: lead.mobile,
    departureCity: lead.departureCity,
    travelDate: new Date(lead.travelDateISO).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    preferences: lead.preferences,
  };
}
