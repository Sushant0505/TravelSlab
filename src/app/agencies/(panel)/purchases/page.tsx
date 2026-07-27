import type { Metadata } from "next";
import { PurchaseHistory } from "@/components/agency/purchase-history";

export const metadata: Metadata = {
  title: "My Purchases",
  robots: { index: false, follow: false },
};

export default function PurchasesPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900">My Purchases</h1>
        <p className="text-xs text-slate-500">
          Unlocked leads, contacts and invoices
        </p>
      </div>
      <PurchaseHistory />
    </div>
  );
}
