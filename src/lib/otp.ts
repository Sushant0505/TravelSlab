/**
 * Mock OTP system.
 *
 * Generates a 6-digit code, stores it (Redis with TTL, in-memory fallback) and
 * verifies it. Until a real SMS provider is wired, the app runs in "mock mode"
 * (no MSG91_AUTH_KEY): `send` returns the code so the UI can display it instead
 * of texting it. When MSG91_AUTH_KEY is set, flip to real delivery in the route
 * and stop returning the code.
 */

import { withRedis } from "@/lib/redis";

const TTL_SECONDS = Math.max(60, Number(process.env.OTP_TTL_SECONDS ?? 300));
const MAX_ATTEMPTS = 5;

interface OtpRecord {
  code: string;
  attempts: number;
  expiresAt: number; // in-memory only
}

const g = globalThis as unknown as { __otps?: Map<string, OtpRecord> };
const memOtps = g.__otps ?? (g.__otps = new Map<string, OtpRecord>());

const redisKey = (mobile: string) => `otp:${mobile}`;

/** Mock mode = no real SMS provider configured; the code is shown on screen. */
export function otpMockMode(): boolean {
  return !process.env.MSG91_AUTH_KEY;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Create + store a fresh OTP for a mobile number; returns the code. */
export async function createOtp(mobile: string): Promise<string> {
  const code = generateCode();
  await withRedis(
    async (r) => {
      await r.set(redisKey(mobile), JSON.stringify({ code, attempts: 0 }), "EX", TTL_SECONDS);
    },
    () => {
      memOtps.set(mobile, { code, attempts: 0, expiresAt: Date.now() + TTL_SECONDS * 1000 });
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
  return withRedis(
    async (r) => {
      const raw = await r.get(redisKey(mobile));
      if (!raw) return { ok: false, error: "Code expired — please resend." };
      const rec = JSON.parse(raw) as { code: string; attempts: number };

      if (rec.attempts >= MAX_ATTEMPTS) {
        await r.del(redisKey(mobile));
        return { ok: false, error: "Too many attempts — please resend." };
      }
      if (rec.code !== code) {
        const ttl = await r.ttl(redisKey(mobile));
        await r.set(
          redisKey(mobile),
          JSON.stringify({ code: rec.code, attempts: rec.attempts + 1 }),
          "EX",
          ttl > 0 ? ttl : TTL_SECONDS,
        );
        return { ok: false, error: "Incorrect code — please try again." };
      }
      await r.del(redisKey(mobile));
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
