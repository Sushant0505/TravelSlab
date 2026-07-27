/**
 * Budget slab model — the core of the TripSlab marketplace.
 *
 * A "slab" is a budget bracket (per traveler, in INR). Every generated lead is
 * automatically categorized into exactly one slab, which drives both the
 * marketplace filtering and the price an agency pays to unlock the lead.
 */

export type SlabId =
  | "s0_5k"
  | "s5_10k"
  | "s10_20k"
  | "s20_50k"
  | "s50_100k"
  | "s100k_plus";

export interface Slab {
  id: SlabId;
  label: string;
  /** Inclusive lower bound (INR). */
  min: number;
  /** Exclusive upper bound (INR). Infinity for the top slab. */
  max: number;
  /** Price an agency pays to unlock a lead in this slab (INR). */
  leadPrice: number;
  /** Tailwind gradient classes used on the slab card. */
  gradient: string;
  /** A few destinations that trend within this budget band. */
  trending: string[];
}

export const SLABS: Slab[] = [
  {
    id: "s0_5k",
    label: "₹0 – ₹5,000",
    min: 0,
    max: 5000,
    leadPrice: 49,
    gradient: "from-emerald-400 to-teal-500",
    trending: ["Local getaways", "Lonavala", "Rishikesh"],
  },
  {
    id: "s5_10k",
    label: "₹5,000 – ₹10,000",
    min: 5000,
    max: 10000,
    leadPrice: 99,
    gradient: "from-cyan-400 to-blue-500",
    trending: ["Goa", "Kashmir", "Manali"],
  },
  {
    id: "s10_20k",
    label: "₹10,000 – ₹20,000",
    min: 10000,
    max: 20000,
    leadPrice: 149,
    gradient: "from-violet-400 to-purple-600",
    trending: ["Kerala", "Andaman", "Meghalaya"],
  },
  {
    id: "s20_50k",
    label: "₹20,000 – ₹50,000",
    min: 20000,
    max: 50000,
    leadPrice: 249,
    gradient: "from-fuchsia-400 to-pink-600",
    trending: ["Leh Ladakh", "Thailand", "Vietnam"],
  },
  {
    id: "s50_100k",
    label: "₹50,000 – ₹1,00,000",
    min: 50000,
    max: 100000,
    leadPrice: 399,
    gradient: "from-orange-400 to-red-500",
    trending: ["Bali", "Dubai", "Arunachal Pradesh"],
  },
  {
    id: "s100k_plus",
    label: "₹1,00,000+",
    min: 100000,
    max: Infinity,
    leadPrice: 399,
    gradient: "from-amber-400 to-yellow-600",
    trending: ["Europe", "Maldives", "Luxury cruises"],
  },
];

/**
 * Categorize a per-traveler budget into a slab.
 *
 *   assignSlab(7500)  -> s5_10k   (₹5k–₹10k)
 *   assignSlab(25000) -> s20_50k  (₹20k–₹50k)
 */
export function assignSlab(budget: number): Slab {
  const slab = SLABS.find((s) => budget >= s.min && budget < s.max);
  // Guard: values at/above the top slab min, or any overflow, land in the top slab.
  return slab ?? SLABS[SLABS.length - 1];
}

export function getSlab(id: SlabId): Slab {
  const slab = SLABS.find((s) => s.id === id);
  if (!slab) throw new Error(`Unknown slab id: ${id}`);
  return slab;
}

export function leadPriceFor(budget: number): number {
  return assignSlab(budget).leadPrice;
}
