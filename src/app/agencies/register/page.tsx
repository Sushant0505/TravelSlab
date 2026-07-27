import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";
import { RegisterForm } from "@/components/agency/register-form";

export const metadata: Metadata = {
  title: "Register Your Agency",
  description:
    "Join TripSlab as a verified travel agency and buy qualified, budget-tagged travel leads.",
};

const PERKS = [
  "Pay per lead — no subscriptions",
  "Verified, OTP-checked travelers",
  "Filter by budget slab, destination & score",
  "Auto-generated GST invoices",
];

export default function AgencyRegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-500 text-white">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="font-bold text-slate-900">
              TripSlab <span className="text-indigo-500">Agencies</span>
            </span>
          </Link>
          <Link
            href="/agencies"
            className="text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            Preview marketplace →
          </Link>
        </div>
      </header>

      <div className="container grid gap-10 py-12 lg:grid-cols-2 lg:items-start">
        <div className="lg:sticky lg:top-12">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Grow with warm,
            <br />
            <span className="text-indigo-600">ready-to-book</span> leads.
          </h1>
          <p className="mt-4 max-w-md text-slate-500">
            TripSlab connects you with travelers who&apos;ve already told us
            where, when and their budget. Register once, get verified, and start
            unlocking leads that fit your business.
          </p>
          <ul className="mt-8 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                <span className="text-sm font-medium">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <RegisterForm />
      </div>
    </main>
  );
}
