/**
 * Traveler accounts (login/signup) + traveler-scoped dashboard data.
 *
 * Prisma/Postgres when configured (see `withDb`), else an in-memory fallback so
 * the flow works with zero infrastructure. Travelers are the same `Traveler`
 * rows that leads attach to — signing up sets a `passwordHash` on the row
 * (creating one if the email is new), so a traveler's submitted trips line up
 * with their account.
 */

import { withDb } from "@/lib/persistence";
import { getSlab } from "@/lib/slabs";
import { hashPassword, verifyPassword } from "@/lib/password";

export interface TravelerAccount {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export interface TravelerTrip {
  id: string;
  reference: string;
  destination: string;
  departureCity: string;
  travelDateISO: string;
  travelers: number;
  budget: number;
  perHead: number;
  slabLabel: string;
  status: string;
  createdAtISO: string;
  /** How many agencies have unlocked (purchased) this lead. */
  unlocks: number;
  unlockedBy: { agency: string; atISO: string }[];
}

type Result =
  | { ok: true; account: TravelerAccount }
  | { ok: false; error: string };

// --- in-memory fallback -----------------------------------------------------

interface MemTraveler extends TravelerAccount {
  passwordHash: string;
  status: "ACTIVE" | "BLOCKED";
}
const g = globalThis as unknown as { __travelerAccounts?: MemTraveler[] };
const mem = g.__travelerAccounts ?? (g.__travelerAccounts = []);

function toAccount(t: { id: string; name: string; email: string; mobile: string }): TravelerAccount {
  return { id: t.id, name: t.name, email: t.email, mobile: t.mobile };
}

// --- auth -------------------------------------------------------------------

export function registerTraveler(input: {
  name: string;
  email: string;
  mobile: string;
  password: string;
}): Promise<Result> {
  const email = input.email.trim().toLowerCase();
  return withDb(
    async (db) => {
      const existing = await db.traveler.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
      });
      if (existing?.passwordHash) {
        return { ok: false, error: "An account with this email already exists. Please log in." };
      }
      const passwordHash = hashPassword(input.password);
      const t = existing
        ? await db.traveler.update({
            where: { id: existing.id },
            data: { passwordHash, name: input.name, mobile: input.mobile },
          })
        : await db.traveler.create({
            data: { name: input.name, email, mobile: input.mobile, passwordHash },
          });
      return { ok: true, account: toAccount(t) };
    },
    () => {
      if (mem.some((t) => t.email === email)) {
        return { ok: false, error: "An account with this email already exists. Please log in." };
      }
      const t: MemTraveler = {
        id: `traveler_${Date.now().toString(36)}`,
        name: input.name,
        email,
        mobile: input.mobile,
        passwordHash: hashPassword(input.password),
        status: "ACTIVE",
      };
      mem.unshift(t);
      return { ok: true, account: toAccount(t) };
    },
  );
}

export function loginTraveler(input: { email: string; password: string }): Promise<Result> {
  const email = input.email.trim().toLowerCase();
  return withDb(
    async (db) => {
      const t = await db.traveler.findFirst({
        where: { email: { equals: email, mode: "insensitive" }, passwordHash: { not: null } },
        orderBy: { createdAt: "desc" },
      });
      if (!t || !verifyPassword(input.password, t.passwordHash)) {
        return { ok: false, error: "Invalid email or password" };
      }
      if (t.status === "BLOCKED") return { ok: false, error: "Your account is blocked. Contact support." };
      return { ok: true, account: toAccount(t) };
    },
    () => {
      const t = mem.find((x) => x.email === email);
      if (!t || !verifyPassword(input.password, t.passwordHash)) {
        return { ok: false, error: "Invalid email or password" };
      }
      if (t.status === "BLOCKED") return { ok: false, error: "Your account is blocked. Contact support." };
      return { ok: true, account: toAccount(t) };
    },
  );
}

export function getTravelerAccount(id: string): Promise<TravelerAccount | null> {
  return withDb(
    async (db) => {
      const t = await db.traveler.findUnique({ where: { id } });
      return t ? toAccount(t) : null;
    },
    () => {
      const t = mem.find((x) => x.id === id);
      return t ? toAccount(t) : null;
    },
  );
}

export function updateTravelerProfile(
  id: string,
  patch: { name?: string; mobile?: string },
): Promise<TravelerAccount | null> {
  return withDb(
    async (db) => {
      const t = await db.traveler.update({
        where: { id },
        data: { name: patch.name, mobile: patch.mobile },
      });
      return toAccount(t);
    },
    () => {
      const t = mem.find((x) => x.id === id);
      if (!t) return null;
      if (patch.name !== undefined) t.name = patch.name;
      if (patch.mobile !== undefined) t.mobile = patch.mobile;
      return toAccount(t);
    },
  );
}

// --- dashboard data ---------------------------------------------------------

export function listTravelerTrips(travelerId: string): Promise<TravelerTrip[]> {
  return withDb(
    async (db) => {
      const rows = await db.lead.findMany({
        where: { travelerId },
        orderBy: { createdAt: "desc" },
        include: {
          purchases: {
            select: { createdAt: true, agency: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        reference: r.reference,
        destination: r.destination,
        departureCity: r.departureCity,
        travelDateISO: r.travelDate.toISOString(),
        travelers: r.travelers,
        budget: r.budget,
        perHead: r.perHead,
        slabLabel: getSlab(r.slab).label,
        status: r.status,
        createdAtISO: r.createdAt.toISOString(),
        unlocks: r.purchases.length,
        unlockedBy: r.purchases.map((p) => ({
          agency: p.agency?.name ?? "An agency",
          atISO: p.createdAt.toISOString(),
        })),
      }));
    },
    // Memory-mode travelers have no attached leads.
    () => [],
  );
}
