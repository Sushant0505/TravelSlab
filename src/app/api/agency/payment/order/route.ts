import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getMarketplaceLead } from "@/server/lead-repo";
import { getRazorpay, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";

export const runtime = "nodejs";

const schema = z.object({ leadId: z.string().min(1) });

/**
 * POST /api/agency/payment/order — create a Razorpay order for a lead's price.
 *
 * Returns `{ demo: true }` when Razorpay isn't configured, so the client falls
 * back to the demo unlock path. Otherwise returns the order + key for Checkout.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const lead = await getMarketplaceLead(parsed.data.leadId, session.id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // No keys → demo mode; the client will unlock without a live payment.
  if (!razorpayConfigured()) {
    return NextResponse.json({ ok: true, demo: true, amount: lead.price });
  }

  const razorpay = getRazorpay()!;
  const order = await razorpay.orders.create({
    amount: lead.price * 100, // paise
    currency: "INR",
    receipt: `lead_${lead.id}_${session.id}`.slice(0, 40),
    notes: { leadId: lead.id, agencyId: session.id, reference: lead.reference },
  });

  return NextResponse.json({
    ok: true,
    demo: false,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayKeyId(),
  });
}
