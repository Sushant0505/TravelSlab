import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  DashboardTopbar,
  DashboardSidebar,
  DashboardMobileTabs,
} from "@/components/dashboard/nav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · TripSlab" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already guards this, but double-check server-side.
  const session = await getSession();
  if (session?.role !== "TRAVELER") redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardTopbar />
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 lg:py-10">
        <DashboardSidebar />
        <main className="min-w-0 flex-1 pb-24 lg:pb-10">{children}</main>
      </div>
      <DashboardMobileTabs />
    </div>
  );
}
