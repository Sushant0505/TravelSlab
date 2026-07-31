import type { Metadata } from "next";
import { AgencyProfileManager } from "@/components/agency/profile-manager";

export const metadata: Metadata = {
  title: "Profile Settings",
  robots: { index: false, follow: false },
};

export default function AgencyProfilePage() {
  return <AgencyProfileManager />;
}
