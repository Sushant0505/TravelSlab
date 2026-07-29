/**
 * Shared banner types + gradient theme presets.
 *
 * Kept dependency-free so it's safe to import from both the client (carousel,
 * admin form) and the server (banner repo). Admins pick a `theme` from the
 * presets below rather than typing raw Tailwind classes.
 */

export interface BannerDTO {
  id: string;
  /** "composed" = gradient + text + collage; "image" = one ready-made graphic. */
  kind: "composed" | "image";
  /** Full ready-made banner image (used when kind = "image"). */
  imageUrl: string;
  eyebrow: string;
  title: string;
  /** Highlighted trailing word/phrase of the title (shown as an amber chip). */
  accent: string;
  subtitle: string;
  discount: string;
  cta: string;
  href: string;
  /** Preset gradient key — see BANNER_THEMES. */
  theme: string;
  /** Up to three "airplane window" images shown on the right. */
  images: string[];
  active: boolean;
  order: number;
}

/**
 * Gradient presets, stored as real color values and applied as inline CSS
 * gradients (not Tailwind classes) — themes are chosen from data at runtime,
 * so Tailwind's build-time class scanner can't reliably generate them.
 */
export const BANNER_THEMES: { id: string; label: string; colors: [string, string, string] }[] = [
  { id: "emerald", label: "Emerald", colors: ["#10b981", "#14b8a6", "#06b6d4"] },
  { id: "violet", label: "Violet", colors: ["#6366f1", "#8b5cf6", "#d946ef"] },
  { id: "sunset", label: "Sunset", colors: ["#f97316", "#f43f5e", "#db2777"] },
  { id: "ocean", label: "Ocean", colors: ["#0ea5e9", "#3b82f6", "#4f46e5"] },
  { id: "royal", label: "Royal", colors: ["#c026d3", "#9333ea", "#4338ca"] },
  { id: "gold", label: "Gold", colors: ["#f59e0b", "#f97316", "#f43f5e"] },
];

function withAlpha(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * Inline `background-image` value for a banner's theme.
 * `overlay` = the banner has a background photo, so the gradient becomes a
 * semi-transparent tint (darker on the left) that keeps white text readable.
 */
export function bannerGradientCss(theme: string, opts?: { overlay?: boolean }): string {
  const t = BANNER_THEMES.find((x) => x.id === theme) ?? BANNER_THEMES[0];
  const [a, b, c] = t.colors;
  if (opts?.overlay) {
    return `linear-gradient(to right, ${withAlpha(a, 0.92)}, ${withAlpha(
      b,
      0.62,
    )} 55%, ${withAlpha(c, 0.38)})`;
  }
  return `linear-gradient(to right, ${a}, ${b}, ${c})`;
}

/**
 * Built-in starter banners. Shown on the home page when no active banners exist
 * yet, and offered as a one-click "load starters" in the admin console.
 */
export const DEFAULT_BANNERS: BannerDTO[] = [
  {
    id: "bucket-list-sale",
    kind: "composed",
    imageUrl: "",
    eyebrow: "From wishlist to window seat",
    title: "The Bucket List Sale is",
    accent: "LIVE",
    subtitle: "Book your dream departure now and save on India's most-loved trips.",
    discount: "Discount up to ₹5,000*",
    cta: "View all packages",
    href: "/#upcoming-trips",
    theme: "emerald",
    images: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80",
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
    ],
    active: true,
    order: 0,
  },
  {
    id: "international-escapes",
    kind: "composed",
    imageUrl: "",
    eyebrow: "Passport-ready getaways",
    title: "International trips from",
    accent: "₹38,999",
    subtitle: "Bali, Thailand & Vietnam group departures with verified partners.",
    discount: "Zero-cost EMI available",
    cta: "Explore international",
    href: "/#upcoming-trips",
    theme: "violet",
    images: [
      "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80",
    ],
    active: true,
    order: 1,
  },
  {
    id: "group-departures",
    kind: "composed",
    imageUrl: "",
    eyebrow: "Solo-friendly · fixed dates",
    title: "Join a group trip to",
    accent: "the Himalayas",
    subtitle: "Ladakh, Spiti & Zanskar backpacking with like-minded travellers.",
    discount: "Limited slots per batch",
    cta: "See group trips",
    href: "/#upcoming-trips",
    theme: "sunset",
    images: [
      "https://images.unsplash.com/photo-1589793907316-f94025b46850?w=600&q=80",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80",
    ],
    active: true,
    order: 2,
  },
];
