import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { ForgotPasswordForm } from "@/components/agency/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Agency Password",
  robots: { index: false, follow: false },
};

export default function AgencyForgotPasswordPage() {
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
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </main>
  );
}
