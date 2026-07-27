/**
 * Database access with a graceful in-memory fallback.
 *
 * `withDb(dbFn, fallback)` runs the Prisma-backed `dbFn` when a database is
 * configured and reachable, otherwise (or on a connection error) it runs
 * `fallback`, which uses the in-memory demo data. This lets the app run with
 * zero setup while transparently using Postgres once DATABASE_URL points at a
 * live database.
 *
 * Only *connection* errors trigger the fallback — genuine query errors are
 * rethrown so real bugs aren't masked. Once a connection failure is seen, the
 * process sticks to the fallback (no repeated connection timeouts) until
 * restart.
 */

import type { PrismaClient } from "@prisma/client";
import { prisma } from "./db";

type DbState = "unknown" | "up" | "down";

const g = globalThis as unknown as { __dbState?: DbState };

function getState(): DbState {
  if (g.__dbState === undefined) {
    g.__dbState = process.env.DATABASE_URL ? "unknown" : "down";
  }
  return g.__dbState;
}

function setState(s: DbState): void {
  g.__dbState = s;
}

// Prisma initialisation / connection error codes.
const CONNECTION_ERROR_CODES = new Set(["P1000", "P1001", "P1002", "P1017"]);

function isConnectionError(err: unknown): boolean {
  const e = err as { name?: string; code?: string };
  return (
    e?.name === "PrismaClientInitializationError" ||
    (typeof e?.code === "string" && CONNECTION_ERROR_CODES.has(e.code))
  );
}

export function databaseEnabled(): boolean {
  return getState() !== "down";
}

export async function withDb<T>(
  dbFn: (db: PrismaClient) => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (getState() === "down") return fallback();

  try {
    const result = await dbFn(prisma);
    setState("up");
    return result;
  } catch (err) {
    if (isConnectionError(err)) {
      if (getState() !== "down") {
        setState("down");
        console.warn(
          "[persistence] Database unreachable — using in-memory demo data.",
        );
      }
      return fallback();
    }
    throw err;
  }
}

export { prisma };
