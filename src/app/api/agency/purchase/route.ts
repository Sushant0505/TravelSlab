import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { purchaseLead } from "@/server/lead-repo";
import { notifyLeadPurchased } from "@/server/notify-repo";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(1),
  // Payment proof from the gateway callback.
  provider: z.enum(["RAZORPAY", "STRIPE"]).default("RAZORPAY"),
  paymentRef: z.string().optional(), // razorpay_payment_id / stripe intent
});

/**
 * POST /api/agency/purchase — unlock a lead after payment.
 *
 * Production flow:
 *   1. Client opens Razorpay/Stripe checkout for `lead.price`.
 *   2. On success the gateway returns a signed payment reference.
 *   3. This route verifies the signature (Razorpay HMAC / Stripe webhook),
 *      then marks the lead SOLD and returns the revealed contact.
 *
 * Demo: signature verification is stubbed; any paymentRef is accepted.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const session = await getSession();
  if (session?.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const agencyId = session.id;

  // TODO: verifyPaymentSignature(parsed.data) before revealing anything.

  const result = await purchaseLead(parsed.data.leadId, agencyId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await notifyLeadPurchased(agencyId, result.reference ?? "");

  return NextResponse.json(
    {
      ok: true,
      invoiceNo: result.invoiceNo,
      reference: result.reference,
      amount: result.amount,
      contact: result.contact, // <-- revealed ONLY here, post-payment
    },
    { status: 201 },
  );
}
