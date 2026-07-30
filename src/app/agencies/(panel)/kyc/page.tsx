import type { Metadata } from "next";
import { KycManager } from "@/components/agency/kyc-manager";

export const metadata: Metadata = {
  title: "Verification",
  robots: { index: false, follow: false },
};

export default function AgencyKycPage() {
  return <KycManager />;
}
