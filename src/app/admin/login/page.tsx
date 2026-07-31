import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <ShieldAlert className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-white">
            TripSlab Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Restricted access. Authorized staff only.
          </p>
        </div>

        <LoginForm
          variant="admin"
          endpoint="/api/auth/admin/login"
          defaultNext="/admin"
        />
      </div>
    </main>
  );
}
