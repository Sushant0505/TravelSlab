/**
 * Shared Redis client (ioredis) for rate-limit counters, slab subscriptions
 * and sessions.
 *
 * Resilient by design: returns null when REDIS_URL is unset or the client
 * can't be constructed, and `withRedis` transparently falls back to an
 * in-memory implementation so the app keeps working without Redis in dev.
 */

import type IORedis from "ioredis";

// Survive HMR / route-module reloads by caching on globalThis.
// `undefined` = not yet initialised, `null` = unavailable.
const g = globalThis as unknown as { __redis?: IORedis | null };

export async function getRedis(): Promise<IORedis | null> {
  if (g.__redis !== undefined) return g.__redis;

  if (!process.env.REDIS_URL) {
    g.__redis = null;
    return null;
  }

  try {
    const IORedisCtor = (await import("ioredis")).default;
    const client = new IORedisCtor(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      // Don't buffer commands while disconnected — fail fast so we fall back.
      enableOfflineQueue: false,
      lazyConnect: false,
    });
    // Swallow connection errors; they surface per-command and trigger fallback.
    client.on("error", (err: Error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[redis] connection error:", err.message);
      }
    });
    g.__redis = client;
    return client;
  } catch {
    g.__redis = null;
    return null;
  }
}

/**
 * Run a Redis operation, falling back to `fallback()` when Redis is
 * unavailable or the command throws.
 */
export async function withRedis<T>(
  fn: (redis: IORedis) => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  const redis = await getRedis();
  if (!redis) return fallback();
  try {
    return await fn(redis);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[redis] command failed, using fallback:", (err as Error).message);
    }
    return fallback();
  }
}
