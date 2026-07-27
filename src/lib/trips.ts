export type TripCategory =
  | "New Launches"
  | "International"
  | "India"
  | "Group Trips";

export interface Trip {
  slug: string;
  title: string;
  route: string;
  image: string;
  duration: string;
  months: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: string;
  categories: TripCategory[];
  destinationSlug?: string;
  badge?: string;
}

export const TRIPS: Trip[] = [
  {
    slug: "ziro-festival-2026",
    title: "Ziro Festival of Music 2026: Music & Camping",
    route: "Guwahati to Guwahati",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&q=80",
    duration: "6N/7D",
    months: "Sep",
    price: 35000,
    rating: 4.9,
    reviews: "10k+",
    categories: ["New Launches", "India", "Group Trips"],
    destinationSlug: "arunachal-pradesh",
    badge: "NEW",
  },
  {
    slug: "kashmir-autumn",
    title: "Kashmir Autumn Trip — 6N/7D Group Tour",
    route: "Srinagar to Srinagar",
    image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=900&q=80",
    duration: "6N/7D",
    months: "Oct – Dec",
    price: 30000,
    rating: 4.8,
    reviews: "10k+",
    categories: ["New Launches", "India", "Group Trips"],
    destinationSlug: "kashmir",
  },
  {
    slug: "zanskar-backpacking",
    title: "Zanskar Valley Backpacking | 8 Days Delhi to Delhi",
    route: "Delhi to Delhi",
    image: "https://images.unsplash.com/photo-1589793907316-f94025b46850?w=900&q=80",
    duration: "7N/8D",
    months: "Jul – Oct",
    price: 25000,
    oldPrice: 28000,
    rating: 4.8,
    reviews: "10k+",
    categories: ["New Launches", "India", "Group Trips"],
    destinationSlug: "leh-ladakh",
    badge: "₹3000 OFF",
  },
  {
    slug: "pin-bhaba-pass",
    title: "Pin Bhaba Pass Trek Himachal",
    route: "Kafnu to Kaza",
    image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=900&q=80",
    duration: "7N/8D",
    months: "Jul – Sep",
    price: 18500,
    rating: 4.7,
    reviews: "10k+",
    categories: ["New Launches", "India", "Group Trips"],
    badge: "NEW",
  },
  {
    slug: "bali-gili",
    title: "Bali with Gili Islands Backpacking",
    route: "Denpasar to Denpasar",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80",
    duration: "6N/7D",
    months: "Year round",
    price: 54999,
    rating: 4.8,
    reviews: "8k+",
    categories: ["International", "Group Trips"],
    destinationSlug: "bali",
    badge: "2 SLOTS LEFT",
  },
  {
    slug: "thailand-fullmoon",
    title: "Thailand: Phuket, Krabi & Full Moon Party",
    route: "Phuket to Phuket",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=900&q=80",
    duration: "6N/7D",
    months: "Nov – Mar",
    price: 38999,
    rating: 4.7,
    reviews: "9k+",
    categories: ["International", "Group Trips"],
    destinationSlug: "thailand",
  },
  {
    slug: "vietnam-north",
    title: "North Vietnam: Hanoi, Halong & Sapa",
    route: "Hanoi to Hanoi",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80",
    duration: "7N/8D",
    months: "Feb – Oct",
    price: 41999,
    rating: 4.8,
    reviews: "6k+",
    categories: ["International", "Group Trips"],
    destinationSlug: "vietnam",
  },
  {
    slug: "meghalaya-explorer",
    title: "Meghalaya Explorer: Root Bridges & Dawki",
    route: "Guwahati to Guwahati",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=900&q=80",
    duration: "5N/6D",
    months: "Oct – May",
    price: 16999,
    rating: 4.7,
    reviews: "5k+",
    categories: ["India", "Group Trips"],
    destinationSlug: "meghalaya",
  },
];

export function tripsByCategory(cat: TripCategory): Trip[] {
  return TRIPS.filter((t) => t.categories.includes(cat));
}

/** Rolling 10-month window shown as filter pills on the homepage. */
export const MONTH_PILLS = [
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr",
] as const;

const MONTHS_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthIndex(token: string): number {
  const key = token.trim().slice(0, 3).toLowerCase();
  return MONTHS_ORDER.findIndex((m) => m.toLowerCase() === key);
}

/**
 * Expand a human `months` string into the set of months it covers.
 *   "Sep"        -> {Sep}
 *   "Jul – Sep"  -> {Jul, Aug, Sep}
 *   "Oct – Feb"  -> {Oct, Nov, Dec, Jan, Feb}   (wraps the year)
 *   "Year round" -> all 12
 */
export function tripMonths(trip: Trip): Set<string> {
  const raw = trip.months.trim();
  if (/year round|flexible|all/i.test(raw)) return new Set(MONTHS_ORDER);

  const parts = raw
    .split(/–|-|\bto\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    const i = monthIndex(parts[0]);
    return i >= 0 ? new Set([MONTHS_ORDER[i]]) : new Set();
  }

  const start = monthIndex(parts[0]);
  const end = monthIndex(parts[1]);
  if (start < 0 || end < 0) return new Set();

  const out = new Set<string>();
  for (let i = start; ; i = (i + 1) % 12) {
    out.add(MONTHS_ORDER[i]);
    if (i === end) break;
  }
  return out;
}

/** Trips filtered by Domestic/International scope + an optional month. */
export function upcomingTrips(
  scope: "Domestic" | "International",
  month: string | null,
): Trip[] {
  const cat: TripCategory = scope === "Domestic" ? "India" : "International";
  return TRIPS.filter((t) => t.categories.includes(cat)).filter(
    (t) => !month || tripMonths(t).has(month),
  );
}

export function tripsForDestination(slug: string): Trip[] {
  return TRIPS.filter((t) => t.destinationSlug === slug);
}

/** Instagram-style story circles for the homepage. */
export interface Story {
  label: string;
  image: string;
  href: string;
  highlight?: boolean;
}

export const STORIES: Story[] = [
  { label: "Bucket List Sale", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&q=80", href: "/plan", highlight: true },
  { label: "Ladakh", image: "https://images.unsplash.com/photo-1589793907316-f94025b46850?w=300&q=80", href: "/destinations/leh-ladakh" },
  { label: "Spiti", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=300&q=80", href: "/destinations/leh-ladakh" },
  { label: "International", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80", href: "/destinations/dubai" },
  { label: "New Launches", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=80", href: "/#showcase" },
  { label: "India", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=300&q=80", href: "/destinations/kerala" },
  { label: "Honeymoon", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=300&q=80", href: "/destinations/bali" },
  { label: "Zanskar", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=300&q=80", href: "/destinations/leh-ladakh" },
  { label: "Treks", image: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=300&q=80", href: "/destinations/meghalaya" },
  { label: "Biking", image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&q=80", href: "/destinations/leh-ladakh" },
  { label: "All Girls", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&q=80", href: "/plan" },
];

/** Mega-menu category column. */
export interface MenuCategory {
  label: string;
  sub: string;
  icon: string; // lucide icon name
}

export const MENU_CATEGORIES: MenuCategory[] = [
  { label: "Backpacking Trips", sub: "India & International", icon: "Backpack" },
  { label: "Bike Trips", sub: "Ladakh, Spiti, Zanskar", icon: "Bike" },
  { label: "Himalayan Treks", sub: "Himachal, Uttarakhand & Kashmir", icon: "Mountain" },
  { label: "All Girls Trips", sub: "Women Only Trips", icon: "Venus" },
];
