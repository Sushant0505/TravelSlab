/**
 * Mock OTP system — passwordless traveler auth.
 *
 * Codes are stored in Postgres (via `withDb`) so "send" and "verify" work even
 * across serverless instances; falls back to in-memory when there's no DB. Send
 * requests are rate-limited (Redis, in-memory fallback).
 *
 * Until a real SMS provider is wired (MSG91_AUTH_KEY), the app runs in "mock
 * mode": `send` returns the code so the UI can display it. To go live, send the
 * SMS in the route and stop returning the code.
 */

import { withDb } from "@/lib/persistence";
import { withRedis } from "@/lib/redis";

const TTL_SECONDS = Math.max(60, Number(process.env.OTP_TTL_SECONDS ?? 300)); // 5 min
const MAX_ATTEMPTS = 5;

// Rate limit: how many OTP sends per mobile per window.
const RL_MAX = Math.max(1, Number(process.env.OTP_RATE_MAX ?? 5));
const RL_WINDOW = Math.max(60, Number(process.env.OTP_RATE_WINDOW ?? 900)); // 15 min

interface OtpRecord {
  code: string;
  attempts: number;
  expiresAt: number;
}
const g = globalThis as unknown as {
  __otps?: Map<string, OtpRecord>;
  __otpSends?: Map<string, number[]>;
};
const memOtps = g.__otps ?? (g.__otps = new Map<string, OtpRecord>());
const memSends = g.__otpSends ?? (g.__otpSends = new Map<string, number[]>());

/** Mock mode = no real SMS provider; the code is shown on screen. */
export function otpMockMode(): boolean {
  return !process.env.MSG91_AUTH_KEY;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Mask a mobile for display, e.g. 98765 43210 -> ••••• •3210. */
export function maskMobile(mobile: string): string {
  if (mobile.length < 4) return mobile;
  return `••••••${mobile.slice(-4)}`;
}

// --- rate limit -------------------------------------------------------------

export async function canSendOtp(
  mobile: string,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  return withRedis(
    async (r) => {
      const key = `otp:rl:${mobile}`;
      const n = await r.incr(key);
      if (n === 1) await r.expire(key, RL_WINDOW);
      if (n > RL_MAX) {
        const ttl = await r.ttl(key);
        return { allowed: false, retryAfter: ttl > 0 ? ttl : RL_WINDOW };
      }
      return { allowed: true };
    },
    () => {
      const now = Date.now();
      const recent = (memSends.get(mobile) ?? []).filter(
        (t) => now - t < RL_WINDOW * 1000,
      );
      if (recent.length >= RL_MAX) {
        return { allowed: false, retryAfter: RL_WINDOW };
      }
      recent.push(now);
      memSends.set(mobile, recent);
      return { allowed: true };
    },
  );
}

// --- create + verify --------------------------------------------------------

/** Create + store a fresh OTP for a mobile number; returns the code. */
export async function createOtp(mobile: string): Promise<string> {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
  await withDb(
    async (db) => {
      await db.otpCode.upsert({
        where: { mobile },
        create: { mobile, code, attempts: 0, expiresAt },
        update: { code, attempts: 0, expiresAt },
      });
    },
    () => {
      memOtps.set(mobile, { code, attempts: 0, expiresAt: expiresAt.getTime() });
    },
  );
  return code;
}

export interface OtpResult {
  ok: boolean;
  error?: string;
}

/** Verify a submitted code; consumes it on success. */
export async function verifyOtp(mobile: string, code: string): Promise<OtpResult> {
  return withDb(
    async (db) => {
      const rec = await db.otpCode.findUnique({ where: { mobile } });
      if (!rec || rec.expiresAt.getTime() < Date.now()) {
        if (rec) await db.otpCode.delete({ where: { mobile } }).catch(() => {});
        return { ok: false, error: "Code expired — please resend." };
      }
      if (rec.attempts >= MAX_ATTEMPTS) {
        await db.otpCode.delete({ where: { mobile } }).catch(() => {});
        return { ok: false, error: "Too many attempts — please resend." };
      }
      if (rec.code !== code) {
        await db.otpCode.update({
          where: { mobile },
          data: { attempts: rec.attempts + 1 },
        });
        return { ok: false, error: "Incorrect code — please try again." };
      }
      await db.otpCode.delete({ where: { mobile } }).catch(() => {});
      return { ok: true };
    },
    () => verifyMem(mobile, code),
  );
}

function verifyMem(mobile: string, code: string): OtpResult {
  const rec = memOtps.get(mobile);
  if (!rec || rec.expiresAt < Date.now()) {
    memOtps.delete(mobile);
    return { ok: false, error: "Code expired — please resend." };
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    memOtps.delete(mobile);
    return { ok: false, error: "Too many attempts — please resend." };
  }
  if (rec.code !== code) {
    rec.attempts += 1;
    return { ok: false, error: "Incorrect code — please try again." };
  }
  memOtps.delete(mobile);
  return { ok: true };
}
