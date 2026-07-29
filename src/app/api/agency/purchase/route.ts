import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { purchaseLead, type PaymentInfo } from "@/server/lead-repo";
import { notifyLeadPurchased } from "@/server/notify-repo";
import { getSession } from "@/lib/auth";
import { razorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().min(1),
  provider: z.enum(["RAZORPAY", "STRIPE"]).default("RAZORPAY"),
  // Razorpay Checkout success payload (required when Razorpay is configured).
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  // Demo-mode reference (used only when no gateway keys are set).
  paymentRef: z.string().optional(),
});

/**
 * POST /api/agency/purchase — unlock a lead after payment.
 *
 * With Razorpay configured, the Checkout success signature is verified
 * (HMAC-SHA256 over `order_id|payment_id`) BEFORE the contact is revealed and a
 * `Payment` row is written. Without keys, the demo path accepts the request so
 * the marketplace still works locally.
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
  const body = parsed.data;

  let payment: PaymentInfo;
  if (razorpayConfigured()) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment proof" }, { status: 400 });
    }
    const valid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }
    payment = { provider: "RAZORPAY", providerRef: razorpay_payment_id, status: "PAID" };
  } else {
    // Demo mode — no live gateway configured.
    payment = {
      provider: body.provider,
      providerRef: body.paymentRef ?? `demo_${Date.now()}`,
      status: "PAID",
    };
  }

  let result;
  try {
    result = await purchaseLead(body.leadId, agencyId, payment);
  } catch (err) {
    console.error("[purchase] failed:", err);
    return NextResponse.json(
      { error: "Could not complete the unlock. Please try again." },
      { status: 500 },
    );
  }
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
