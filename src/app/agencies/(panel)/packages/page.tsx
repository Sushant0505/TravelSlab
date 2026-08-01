import type { Metadata } from "next";
import { AgencyPackagesManager } from "@/components/agency/packages-manager";

export const metadata: Metadata = {
  title: "My Packages",
  robots: { index: false, follow: false },
};

export default function AgencyPackagesPage() {
  return <AgencyPackagesManager />;
}
