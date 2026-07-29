"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building,
  Wallet,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type { MarketplaceLead } from "@/lib/masking";
import { useAgency } from "@/store/agency";
import { formatINR } from "@/lib/utils";

type Method = "upi" | "card" | "netbanking" | "wallet";

const METHODS: { id: Method; label: string; icon: typeof Smartphone; provider: string }[] = [
  { id: "upi", label: "UPI", icon: Smartphone, provider: "Razorpay" },
  { id: "card", label: "Card", icon: CreditCard, provider: "Razorpay" },
  { id: "netbanking", label: "Net Banking", icon: Building, provider: "Razorpay" },
  { id: "wallet", label: "Wallet", icon: Wallet, provider: "Razorpay" },
];

// --- Razorpay Checkout (browser) types ------------------------------------
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: RazorpayResponse) => void) => void;
}
interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  theme?: { color?: string };
  handler: (resp: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}
declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve();
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.id = "razorpay-checkout-js";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

export function BuyModal({
  lead,
  onClose,
  onPurchased,
}: {
  lead: MarketplaceLead | null;
  onClose: () => void;
  onPurchased: (leadId: string) => void;
}) {
  const [method, setMethod] = useState<Method>("upi");
  const [phase, setPhase] = useState<"select" | "processing" | "done" | "error">(
    "select",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const addPurchase = useAgency((s) => s.addPurchase);
  const spend = useAgency((s) => s.spend);

  /** Finalize: verify+unlock server-side, then update local state. */
  async function completePurchase(extra: Record<string, string>) {
    if (!lead) return;
    try {
      const res = await fetch("/api/agency/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Payment could not be verified");

      addPurchase({
        leadId: lead.id,
        reference: data.reference,
        invoiceNo: data.invoiceNo,
        amount: data.amount,
        destination: lead.destination,
        purchasedAtISO: new Date().toISOString(),
        contact: data.contact,
      });
      spend(data.amount);
      setPhase("done");
      setTimeout(() => {
        onPurchased(lead.id);
        onClose();
        setPhase("select");
      }, 1400);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Payment failed. Please try again.");
      setPhase("error");
    }
  }

  async function pay() {
    if (!lead) return;
    setErrorMsg("");
    setPhase("processing");
    try {
      // 1. Ask the server to open an order (or tell us it's demo mode).
      const orderRes = await fetch("/api/agency/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order?.error ?? "Could not start payment");

      // 2a. No gateway configured → demo unlock.
      if (order.demo) {
        await completePurchase({ provider: "RAZORPAY", paymentRef: `demo_${Date.now()}` });
        return;
      }

      // 2b. Real Razorpay Checkout.
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay unavailable");
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "TripSlab",
        description: `Unlock lead · ${lead.destination}`,
        theme: { color: "#4f46e5" },
        handler: (resp) => {
          completePurchase({
            provider: "RAZORPAY",
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
        },
        modal: { ondismiss: () => setPhase("select") },
      });
      rzp.on("payment.failed", () => {
        setErrorMsg("Payment failed at the gateway. Please try another method.");
        setPhase("error");
      });
      rzp.open();
    } catch {
      setErrorMsg("Could not start payment. Please try again.");
      setPhase("error");
    }
  }

  return (
    <AnimatePresence>
      {lead && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Lock className="h-4 w-4 text-indigo-500" />
                Unlock this lead
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {phase === "done" ? (
              <SuccessState destination={lead.destination} amount={lead.price} />
            ) : (
              <div className="px-6 py-5">
                <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {lead.destination}
                    </div>
                    <div className="text-xs text-slate-500">
                      {lead.budgetRange} · Score {lead.leadScore}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {formatINR(lead.price)}
                    </div>
                    <div className="text-[11px] text-slate-400">incl. GST</div>
                  </div>
                </div>

                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Payment method
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {METHODS.map((m) => {
                    const active = method === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        disabled={phase === "processing"}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <m.icon className="h-5 w-5" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 text-center text-[11px] text-slate-400">
                  Secured by Razorpay
                </div>

                {phase === "error" && (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {errorMsg || "Payment failed or was cancelled. Please try again."}
                  </p>
                )}

                <button
                  onClick={pay}
                  disabled={phase === "processing"}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70"
                >
                  {phase === "processing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>Pay {formatINR(lead.price)} &amp; reveal contact</>
                  )}
                </button>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Traveler details revealed instantly after payment. Invoice
                  emailed automatically.
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SuccessState({
  destination,
  amount,
}: {
  destination: string;
  amount: number;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white"
      >
        <CheckCircle2 className="h-8 w-8" />
      </motion.div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">Payment successful</h3>
      <p className="mt-1 text-sm text-slate-500">
        {formatINR(amount)} paid · {destination} lead unlocked. Revealing
        contact…
      </p>
    </div>
  );
}
