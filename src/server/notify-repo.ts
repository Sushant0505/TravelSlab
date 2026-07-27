/**
 * Notifications + agency slab-subscriptions.
 *
 * Notifications are stored in Postgres (Prisma `Notification`), slab
 * subscriptions in Redis sets. Both transparently fall back to in-memory
 * stores when their backend isn't configured/reachable (see `withDb` /
 * `withRedis`), so the panels work with or without infrastructure.
 *
 * Core marketplace rule: a new lead is categorised into a budget slab, and
 * ONLY agencies subscribed to that slab receive a "new lead" notification.
 * Admins are always notified.
 */

import { SLABS, type SlabId } from "@/lib/slabs";
import { DEMO_AGENCY_ID } from "@/lib/session";
import { withDb } from "@/lib/persistence";
import { withRedis } from "@/lib/redis";
import type { Notification as NotifRow } from "@prisma/client";

export type NotifAudience = "AGENCY" | "ADMIN";
export type NotifKind =
  | "LEAD_AVAILABLE"
  | "LEAD_PURCHASED"
  | "SUSPICIOUS"
  | "AGENCY_REGISTRATION"
  | "SYSTEM";

export interface Notification {
  id: string;
  audience: NotifAudience;
  agencyId?: string; // set when targeted at a specific agency (Prisma: refId)
  kind: NotifKind;
  title: string;
  body: string;
  slab?: SlabId;
  leadRef?: string;
  read: boolean;
  createdAtISO: string;
}

type NewNotif = Omit<Notification, "id" | "read" | "createdAtISO"> & {
  createdAtISO?: string;
};

// ===========================================================================
// In-memory fallback state (survives HMR via globalThis)
// ===========================================================================

const g = globalThis as unknown as {
  __notifs?: Notification[];
  __subs?: Map<string, Set<SlabId>>;
  __notifSeeded?: boolean;
};

const notifs: Notification[] = g.__notifs ?? (g.__notifs = []);

// Seed the demo agency + a spread of others so the fan-out has recipients.
const subs: Map<string, Set<SlabId>> =
  g.__subs ??
  (g.__subs = new Map<string, Set<SlabId>>([
    [DEMO_AGENCY_ID, new Set<SlabId>(["s5_10k", "s10_20k", "s20_50k"])],
    ["agency_101", new Set<SlabId>(["s0_5k", "s5_10k"])],
    ["agency_102", new Set<SlabId>(["s20_50k", "s50_100k", "s100k_plus"])],
    ["agency_103", new Set<SlabId>(["s5_10k", "s10_20k"])],
    ["agency_104", new Set<SlabId>(["s100k_plus"])],
  ]));

let seq = notifs.length;
function memId() {
  seq += 1;
  return `ntf_${Date.now().toString(36)}_${seq}`;
}
function memPush(n: NewNotif) {
  notifs.unshift({
    id: memId(),
    read: false,
    createdAtISO: n.createdAtISO ?? new Date().toISOString(),
    ...n,
  });
}

// ===========================================================================
// Prisma mapper
// ===========================================================================

function rowToNotif(row: NotifRow): Notification {
  return {
    id: row.id,
    audience: row.audience as NotifAudience,
    agencyId: row.refId ?? undefined,
    kind: row.kind as NotifKind,
    title: row.title,
    body: row.body,
    slab: (row.slab as SlabId | null) ?? undefined,
    leadRef: row.leadRef ?? undefined,
    read: row.read,
    createdAtISO: row.createdAt.toISOString(),
  };
}

/** Persist one notification (Prisma when available, else in-memory). */
function pushNotif(n: NewNotif): Promise<void> {
  return withDb(
    async (db) => {
      await db.notification.create({
        data: {
          audience: n.audience,
          refId: n.agencyId ?? null,
          kind: n.kind,
          title: n.title,
          body: n.body,
          slab: n.slab ?? null,
          leadRef: n.leadRef ?? null,
          ...(n.createdAtISO ? { createdAt: new Date(n.createdAtISO) } : {}),
        },
      });
    },
    () => {
      memPush(n);
    },
  );
}

// ===========================================================================
// Subscriptions (Redis sets, in-memory Map fallback)
// ===========================================================================

const SLAB_ORDER = SLABS.map((s) => s.id);
function inSlabOrder(ids: Iterable<string>): SlabId[] {
  const set = new Set(ids);
  return SLAB_ORDER.filter((id) => set.has(id));
}

export function getSubscriptions(agencyId: string): Promise<SlabId[]> {
  return withRedis(
    async (r) => inSlabOrder(await r.smembers(`subs:agency:${agencyId}`)),
    () => SLAB_ORDER.filter((sid) => subs.get(agencyId)?.has(sid)),
  );
}

export function setSubscriptions(agencyId: string, slabs: SlabId[]): Promise<SlabId[]> {
  return withRedis(
    async (r) => {
      const key = `subs:agency:${agencyId}`;
      const prev = await r.smembers(key);
      const nextSet = new Set(slabs);
      const prevSet = new Set(prev);

      const pipe = r.pipeline();
      pipe.del(key);
      if (slabs.length) pipe.sadd(key, ...slabs);
      // Maintain the reverse (per-slab -> agencies) index for fan-out.
      for (const s of prev) if (!nextSet.has(s as SlabId)) pipe.srem(`subs:slab:${s}`, agencyId);
      for (const s of slabs) if (!prevSet.has(s)) pipe.sadd(`subs:slab:${s}`, agencyId);
      await pipe.exec();

      return inSlabOrder(slabs);
    },
    () => {
      subs.set(agencyId, new Set(slabs));
      return inSlabOrder(slabs);
    },
  );
}

export function agenciesSubscribedTo(slab: SlabId): Promise<string[]> {
  return withRedis(
    async (r) => r.smembers(`subs:slab:${slab}`),
    () => {
      const out: string[] = [];
      for (const [agencyId, set] of subs) if (set.has(slab)) out.push(agencyId);
      return out;
    },
  );
}

// ===========================================================================
// Fan-out + notify helpers
// ===========================================================================

export async function notifyNewLead(input: {
  slab: SlabId;
  reference: string;
  destination: string;
  budgetRange: string;
}): Promise<{ adminNotified: boolean; agenciesNotified: number }> {
  const slabLabel = SLABS.find((s) => s.id === input.slab)?.label ?? input.slab;

  // Admin always hears about it.
  await pushNotif({
    audience: "ADMIN",
    kind: "LEAD_AVAILABLE",
    title: "New lead created",
    body: `${input.destination} · ${input.budgetRange} (${input.reference})`,
    slab: input.slab,
    leadRef: input.reference,
  });

  // Only agencies subscribed to this slab.
  const recipients = await agenciesSubscribedTo(input.slab);
  for (const agencyId of recipients) {
    await pushNotif({
      audience: "AGENCY",
      agencyId,
      kind: "LEAD_AVAILABLE",
      title: `New ${input.destination} lead in your slab`,
      body: `A ${slabLabel} lead just landed — be first to unlock it.`,
      slab: input.slab,
      leadRef: input.reference,
    });
  }
  return { adminNotified: true, agenciesNotified: recipients.length };
}

export function notifySuspicious(body: string): Promise<void> {
  return pushNotif({ audience: "ADMIN", kind: "SUSPICIOUS", title: "Suspicious activity", body });
}

export function notifyAgencyRegistration(name: string): Promise<void> {
  return pushNotif({
    audience: "ADMIN",
    kind: "AGENCY_REGISTRATION",
    title: "Agency registration",
    body: `${name} applied and is awaiting approval.`,
  });
}

export function notifyLeadPurchased(agencyId: string, ref: string): Promise<void> {
  return pushNotif({
    audience: "AGENCY",
    agencyId,
    kind: "LEAD_PURCHASED",
    title: "Lead unlocked",
    body: `Contact details for lead ${ref} are now available in My Purchases.`,
    leadRef: ref,
  });
}

// ===========================================================================
// Reads
// ===========================================================================

export function listAgencyNotifications(agencyId: string): Promise<Notification[]> {
  return withDb(
    async (db) => {
      const rows = await db.notification.findMany({
        where: { audience: "AGENCY", refId: agencyId },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(rowToNotif);
    },
    () => notifs.filter((n) => n.audience === "AGENCY" && n.agencyId === agencyId),
  );
}

export function listAdminNotifications(): Promise<Notification[]> {
  return withDb(
    async (db) => {
      const rows = await db.notification.findMany({
        where: { audience: "ADMIN" },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(rowToNotif);
    },
    () => notifs.filter((n) => n.audience === "ADMIN"),
  );
}

export function unreadAgency(agencyId: string): Promise<number> {
  return withDb(
    (db) => db.notification.count({ where: { audience: "AGENCY", refId: agencyId, read: false } }),
    () =>
      notifs.filter((n) => n.audience === "AGENCY" && n.agencyId === agencyId && !n.read).length,
  );
}

export function unreadAdmin(): Promise<number> {
  return withDb(
    (db) => db.notification.count({ where: { audience: "ADMIN", read: false } }),
    () => notifs.filter((n) => n.audience === "ADMIN" && !n.read).length,
  );
}

export function markRead(idToRead: string): Promise<void> {
  return withDb(
    async (db) => {
      await db.notification.updateMany({ where: { id: idToRead }, data: { read: true } });
    },
    () => {
      const n = notifs.find((x) => x.id === idToRead);
      if (n) n.read = true;
    },
  );
}

export function markAllReadAgency(agencyId: string): Promise<void> {
  return withDb(
    async (db) => {
      await db.notification.updateMany({
        where: { audience: "AGENCY", refId: agencyId },
        data: { read: true },
      });
    },
    () => {
      notifs
        .filter((n) => n.audience === "AGENCY" && n.agencyId === agencyId)
        .forEach((n) => (n.read = true));
    },
  );
}

export function markAllReadAdmin(): Promise<void> {
  return withDb(
    async (db) => {
      await db.notification.updateMany({ where: { audience: "ADMIN" }, data: { read: true } });
    },
    () => {
      notifs.filter((n) => n.audience === "ADMIN").forEach((n) => (n.read = true));
    },
  );
}

// ===========================================================================
// Seed a lively initial feed — IN-MEMORY ONLY (the DB feed comes from the
// Prisma seed script). Never touches the database.
// ===========================================================================

if (!g.__notifSeeded) {
  g.__notifSeeded = true;
  const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

  memPush({
    audience: "ADMIN",
    kind: "AGENCY_REGISTRATION",
    title: "Agency registration",
    body: "BlueSky Holidays applied and is awaiting approval.",
  });
  memPush({
    audience: "ADMIN",
    kind: "SUSPICIOUS",
    title: "Suspicious activity",
    body: "3 leads from the same device fingerprint in 20 minutes.",
  });

  const samples: { slab: SlabId; ref: string; dest: string; range: string; h: number }[] = [
    { slab: "s5_10k", ref: "TS-KX21", dest: "Kashmir", range: "₹5,000 – ₹10,000", h: 2 },
    { slab: "s20_50k", ref: "TS-LD88", dest: "Leh Ladakh", range: "₹20,000 – ₹50,000", h: 6 },
    { slab: "s10_20k", ref: "TS-KE40", dest: "Kerala", range: "₹10,000 – ₹20,000", h: 20 },
  ];
  for (const s of samples) {
    memPush({
      audience: "ADMIN",
      kind: "LEAD_AVAILABLE",
      title: "New lead created",
      body: `${s.dest} · ${s.range} (${s.ref})`,
      slab: s.slab,
      leadRef: s.ref,
      createdAtISO: ago(s.h),
    });
    if (subs.get(DEMO_AGENCY_ID)?.has(s.slab)) {
      memPush({
        audience: "AGENCY",
        agencyId: DEMO_AGENCY_ID,
        kind: "LEAD_AVAILABLE",
        title: `New ${s.dest} lead in your slab`,
        body: `A ${SLABS.find((x) => x.id === s.slab)?.label} lead just landed — be first to unlock it.`,
        slab: s.slab,
        leadRef: s.ref,
        createdAtISO: ago(s.h),
      });
    }
  }
}
