/**
 * Abuse prevention for lead submission.
 *
 * Rule: max N leads per identity per 24h, where identity is the union of
 * (IP, mobile, browser fingerprint). Uses Redis when REDIS_URL is set, and
 * falls back to an in-memory map for local dev.
 *
 * NOTE: `ioredis` is intentionally imported lazily so the app builds/runs
 * without Redis during early development.
 */

const MAX = Number(process.env.MAX_LEADS_PER_24H ?? 3);
const WINDOW_SECONDS = 24 * 60 * 60;

// --- in-memory fallback -----------------------------------------------------
const memory = new Map<string, { count: number; expires: number }>();

async function getRedis(): Promise<any | null> {
  if (!process.env.REDIS_URL) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = (await import("ioredis")).default;
    return new IORedis(process.env.REDIS_URL);
  } catch {
    return null;
  }
}

export interface RateResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

// Loopback / unknown addresses only occur in local dev (real traffic carries a
// client IP via x-forwarded-for), where every request shares one address and
// would otherwise trip the per-IP cap. Skip the IP signal for those.
const LOOPBACK_IPS = new Set(["0.0.0.0", "127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"]);
function isLoopback(ip?: string): boolean {
  return !ip || LOOPBACK_IPS.has(ip.trim());
}

/**
 * Increment the counters for each signal and return whether the submission
 * is allowed. Any single signal exceeding the cap blocks the request.
 */
export async function checkLeadRateLimit(signals: {
  ip?: string;
  mobile?: string;
  fingerprint?: string;
}): Promise<RateResult> {
  // Escape hatch for local testing where the same number is submitted repeatedly.
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return { allowed: true, remaining: MAX, limit: MAX };
  }

  const keys = [
    signals.ip && !isLoopback(signals.ip) && `lead:ip:${signals.ip}`,
    signals.mobile && `lead:mob:${signals.mobile}`,
    signals.fingerprint && `lead:fp:${signals.fingerprint}`,
  ].filter(Boolean) as string[];

  if (keys.length === 0) return { allowed: true, remaining: MAX, limit: MAX };

  const redis = await getRedis();

  let worst = 0;
  for (const key of keys) {
    const count = redis
      ? await incrRedis(redis, key)
      : incrMemory(key);
    worst = Math.max(worst, count);
  }

  if (redis) redis.quit?.();

  return {
    allowed: worst <= MAX,
    remaining: Math.max(0, MAX - worst),
    limit: MAX,
  };
}

async function incrRedis(redis: any, key: string): Promise<number> {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECONDS);
  return count;
}

function incrMemory(key: string): number {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expires < now) {
    memory.set(key, { count: 1, expires: now + WINDOW_SECONDS * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}
