/**
 * Razorpay server helpers.
 *
 * Real gateway when RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set; otherwise the
 * app stays in "demo" mode (the purchase flow unlocks without a live payment),
 * so the marketplace works without keys during local dev / demos.
 */

import crypto from "crypto";
import Razorpay from "razorpay";

const g = globalThis as unknown as { __razorpay?: Razorpay | null };

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** The public key id the browser Checkout needs. */
export function razorpayKeyId(): string | undefined {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
}

export function getRazorpay(): Razorpay | null {
  if (g.__razorpay !== undefined) return g.__razorpay;
  if (!razorpayConfigured()) {
    g.__razorpay = null;
    return null;
  }
  g.__razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  return g.__razorpay;
}

/**
 * Verify the signature Razorpay Checkout returns on success:
 *   HMAC_SHA256(`${order_id}|${payment_id}`, key_secret) === razorpay_signature
 */
export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature ?? "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
