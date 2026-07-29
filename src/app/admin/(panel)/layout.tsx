import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";

export const metadata: Metadata = {
  title: "Admin Console",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: enforce the ADMIN role in the render path too, not only
  // in middleware. Guests -> admin login; any other role -> /login.
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect(session ? "/login" : "/admin/login");

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
