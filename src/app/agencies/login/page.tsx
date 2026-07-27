import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { DEMO_AGENCY_EMAIL, DEMO_AGENCY_PASSWORD } from "@/lib/session";

export const metadata: Metadata = {
  title: "Agency Login",
  robots: { index: false, follow: false },
};

export default function AgencyLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-slate-900">
              TripSlab <span className="text-indigo-500">Agencies</span>
            </span>
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to browse and unlock leads.
          </p>
        </div>

        <LoginForm
          variant="agency"
          endpoint="/api/auth/agency/login"
          defaultNext="/agencies"
          demoEmail={DEMO_AGENCY_EMAIL}
          demoPassword={DEMO_AGENCY_PASSWORD}
        />

        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link href="/agencies/register" className="font-semibold text-indigo-600">
            Register your agency
          </Link>
        </p>
      </div>
    </main>
  );
}
