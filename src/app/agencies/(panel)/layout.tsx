import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AgencySidebar } from "@/components/agency/sidebar";
import { AgencyTopbar } from "@/components/agency/topbar";

export default async function AgencyPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: enforce the AGENCY role in the render path too, not only
  // in middleware. Guests -> agency login; any other role -> /login.
  const session = await getSession();
  if (session?.role !== "AGENCY") redirect(session ? "/login" : "/agencies/login");

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AgencySidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AgencyTopbar />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
