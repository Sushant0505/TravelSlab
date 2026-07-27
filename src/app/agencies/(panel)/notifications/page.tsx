import type { Metadata } from "next";
import { AgencyNotifications } from "@/components/agency/notifications";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default function AgencyNotificationsPage() {
  return <AgencyNotifications />;
}
