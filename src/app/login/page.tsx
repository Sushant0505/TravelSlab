import type { Metadata } from "next";
import { TravelerAuthForm } from "@/components/auth/traveler-auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your TripSlab traveler account.",
};

export default function LoginPage() {
  return <TravelerAuthForm mode="login" />;
}
