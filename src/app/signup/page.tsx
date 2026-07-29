import type { Metadata } from "next";
import { TravelerAuthForm } from "@/components/auth/traveler-auth";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free TripSlab traveler account and get matched with verified agencies.",
};

export default function SignupPage() {
  return <TravelerAuthForm mode="signup" />;
}
