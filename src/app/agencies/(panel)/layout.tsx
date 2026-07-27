import { AgencySidebar } from "@/components/agency/sidebar";
import { AgencyTopbar } from "@/components/agency/topbar";

export default function AgencyPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
