import type { Metadata } from "next";
import { Marketplace } from "@/components/agency/marketplace";

export const metadata: Metadata = {
  title: "Lead Marketplace",
  robots: { index: false, follow: false },
};

export default function AgencyMarketplacePage() {
  return <Marketplace />;
}
