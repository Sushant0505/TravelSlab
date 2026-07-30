/**
 * Traveler accounts (passwordless, OTP-based) + traveler-scoped dashboard data.
 *
 * Prisma/Postgres when configured (see `withDb`), else an in-memory fallback.
 * Accounts are created automatically when a trip is submitted (post-OTP), and
 * are deduplicated by email OR mobile. There are no passwords.
 */

import { withDb } from "@/lib/persistence";
import { getSlab } from "@/lib/slabs";

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
  /** Timestamps of each unlock. Agency identity is intentionally NOT exposed. */
  unlockedBy: { atISO: string }[];
}

// --- in-memory fallback -----------------------------------------------------

interface MemTraveler extends TravelerAccount {
  status: "ACTIVE" | "BLOCKED";
}
const g = globalThis as unknown as { __travelerAccounts?: MemTraveler[] };
const mem = g.__travelerAccounts ?? (g.__travelerAccounts = []);

function toAccount(t: { id: string; name: string; email: string; mobile: string }): TravelerAccount {
  return { id: t.id, name: t.name, email: t.email, mobile: t.mobile };
}

// --- lookup / create --------------------------------------------------------

/** Find an account by email (case-insensitive) OR mobile. */
export function findTravelerByIdentifier(identifier: string): Promise<TravelerAccount | null> {
  const raw = identifier.trim();
  const email = raw.toLowerCase();
  return withDb(
    async (db) => {
      const t = await db.traveler.findFirst({
        where: { OR: [{ email: { equals: email, mode: "insensitive" } }, { mobile: raw }] },
        orderBy: { createdAt: "asc" },
      });
      return t ? toAccount(t) : null;
    },
    () => {
      const t = mem.find((x) => x.email === email || x.mobile === raw);
      return t ? toAccount(t) : null;
    },
  );
}

/**
 * Find an account by email OR mobile, else create one — the auto-account step of
 * trip submission. Dedupes so the same email/mobile never makes two accounts.
 */
export function findOrCreateTraveler(input: {
  name: string;
  email: string;
  mobile: string;
}): Promise<TravelerAccount> {
  const email = input.email.trim().toLowerCase();
  const mobile = input.mobile.trim();
  return withDb(
    async (db) => {
      const existing = await db.traveler.findFirst({
        where: { OR: [{ email: { equals: email, mode: "insensitive" } }, { mobile }] },
        orderBy: { createdAt: "asc" },
      });
      if (existing) {
        const updated = await db.traveler.update({
          where: { id: existing.id },
          data: { name: input.name, mobile },
        });
        return toAccount(updated);
      }
      const created = await db.traveler.create({
        data: { name: input.name, email, mobile },
      });
      return toAccount(created);
    },
    () => {
      const found = mem.find((x) => x.email === email || x.mobile === mobile);
      if (found) {
        found.name = input.name;
        found.mobile = mobile;
        return toAccount(found);
      }
      const created: MemTraveler = {
        id: `traveler_${Date.now().toString(36)}`,
        name: input.name,
        email,
        mobile,
        status: "ACTIVE",
      };
      mem.unshift(created);
      return toAccount(created);
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
            select: { createdAt: true }, // agency identity deliberately excluded
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
        unlockedBy: r.purchases.map((p) => ({ atISO: p.createdAt.toISOString() })),
      }));
    },
    // Memory-mode travelers have no attached leads.
    () => [],
  );
}
