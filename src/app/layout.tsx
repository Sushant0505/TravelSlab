import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { WelcomePopup } from "@/components/home/welcome-popup";
import { FloatingActions } from "@/components/layout/floating-actions";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TripSlab — Plan Your Trip, Get Matched With Verified Agencies",
    template: "%s · TripSlab",
  },
  description:
    "TripSlab is India's premium travel lead marketplace. Plan your trip in a minute and get matched with verified travel agencies who compete to craft your perfect itinerary — free for travelers.",
  keywords: [
    "travel leads",
    "travel agency marketplace",
    "plan a trip India",
    "trip planner",
    "Goa Bali Ladakh packages",
    "travel lead generation",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "TripSlab — Plan Your Trip, Get Matched With Verified Agencies",
    description:
      "Plan your trip in a minute. Verified agencies compete to craft your perfect itinerary — free for travelers.",
    siteName: "TripSlab",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "TripSlab" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TripSlab — India's Travel Lead Marketplace",
    description:
      "Plan your trip. Get matched with verified agencies. Free for travelers.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  width: "device-width",
  initialScale: 1,
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TripSlab",
  url: siteUrl,
  description:
    "India's premium travel lead marketplace connecting travelers with verified travel agencies.",
  sameAs: [],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <Providers>
          {children}
          <WelcomePopup />
          <FloatingActions />
        </Providers>
      </body>
    </html>
  );
}
