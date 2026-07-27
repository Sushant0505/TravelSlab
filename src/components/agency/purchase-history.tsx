"use client";

import { motion } from "framer-motion";
import {
  ShoppingBag,
  Download,
  Phone,
  Mail,
  MapPin,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { useAgency } from "@/store/agency";
import { formatINR } from "@/lib/utils";

export function PurchaseHistory() {
  const purchases = useAgency((s) => s.purchases);
  const total = purchases.reduce((s, p) => s + p.amount, 0);

  if (purchases.length === 0) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-24 text-center text-slate-400">
        <Inbox className="h-9 w-9" />
        <p>You haven&apos;t bought any leads yet.</p>
        <Link
          href="/agencies"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Browse the marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total purchases
            </div>
            <div className="text-xl font-bold text-slate-900">
              {purchases.length} leads · {formatINR(total)}
            </div>
          </div>
        </div>
      </div>

      <div id="invoices" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {purchases.map((p, i) => (
              <motion.tr
                key={p.leadId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="hover:bg-slate-50/60"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {p.invoiceNo}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    {p.destination}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {p.reference}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">
                    {p.contact.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <a
                      href={`tel:${p.contact.mobile}`}
                      className="flex items-center gap-1 hover:text-indigo-600"
                    >
                      <Phone className="h-3 w-3" />
                      {p.contact.mobile}
                    </a>
                    <a
                      href={`mailto:${p.contact.email}`}
                      className="flex items-center gap-1 hover:text-indigo-600"
                    >
                      <Mail className="h-3 w-3" />
                      email
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(p.purchasedAtISO).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatINR(p.amount)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    title="Download invoice (stub)"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Invoice
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
