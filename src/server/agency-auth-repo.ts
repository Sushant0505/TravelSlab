/**
 * Agency auth data access — the parts that touch `passwordHash` and reset
 * tokens, kept separate from `admin-repo` so those secrets never leak into the
 * admin-facing `AdminAgency` shape.
 *
 * Prisma/Postgres when configured; a small in-memory fallback keyed off the
 * admin-repo demo agencies otherwise (dev only).
 */

import { withDb } from "@/lib/persistence";
import { findAgencyByEmail, getAgencyById, type AgencyStatus } from "./admin-repo";

// Shared with admin-repo's memory create (dev fallback): agencyId -> passwordHash.
const g = globalThis as unknown as {
  __agencyCreds?: Map<string, string>;
  __agencyResetTokens?: Map<string, { agencyId: string; expiresAt: number; used: boolean }>;
};
const creds = g.__agencyCreds ?? (g.__agencyCreds = new Map());
const resetTokens =
  g.__agencyResetTokens ?? (g.__agencyResetTokens = new Map());

export interface AgencyAuthRecord {
  id: string;
  name: string;
  email: string;
  status: AgencyStatus;
  passwordHash: string;
}

export interface AgencyProfile {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber: string;
  city: string;
  status: AgencyStatus;
}

/** Login lookup — includes passwordHash for bcrypt.compare. */
export function findAgencyAuthByEmail(email: string): Promise<AgencyAuthRecord | null> {
  const e = email.trim().toLowerCase();
  return withDb(
    async (db) => {
      const a = await db.agency.findFirst({
        where: { email: { equals: e, mode: "insensitive" } },
        select: { id: true, name: true, email: true, status: true, passwordHash: true },
      });
      return a ?? null;
    },
    async () => {
      const a = await findAgencyByEmail(e);
      if (!a) return null;
      return {
        id: a.id,
        name: a.name,
        email: a.email,
        status: a.status,
        passwordHash: creds.get(a.id) ?? "",
      };
    },
  );
}

/** True when another agency already uses this phone number. */
export function agencyPhoneExists(phone: string, exceptId?: string): Promise<boolean> {
  const p = phone.trim();
  return withDb(
    async (db) => {
      const a = await db.agency.findFirst({
        where: { phone: p, ...(exceptId ? { id: { not: exceptId } } : {}) },
        select: { id: true },
      });
      return Boolean(a);
    },
    () => false, // memory fallback doesn't enforce phone uniqueness
  );
}

/** Store a freshly-created agency's password hash (memory-mode helper). */
export function rememberAgencyCred(agencyId: string, passwordHash: string): void {
  creds.set(agencyId, passwordHash);
}

export function getAgencyPasswordHash(id: string): Promise<string | null> {
  return withDb(
    async (db) => {
      const a = await db.agency.findUnique({ where: { id }, select: { passwordHash: true } });
      return a?.passwordHash ?? null;
    },
    () => creds.get(id) ?? null,
  );
}

export function updateAgencyPassword(id: string, passwordHash: string): Promise<boolean> {
  return withDb(
    async (db) => {
      await db.agency.update({ where: { id }, data: { passwordHash } });
      return true;
    },
    () => {
      creds.set(id, passwordHash);
      return true;
    },
  );
}

export function getAgencyProfile(id: string): Promise<AgencyProfile | null> {
  return withDb(
    async (db) => {
      const a = await db.agency.findUnique({
        where: { id },
        select: {
          id: true, name: true, ownerName: true, email: true,
          phone: true, gstNumber: true, city: true, status: true,
        },
      });
      if (!a) return null;
      return { ...a, gstNumber: a.gstNumber ?? "", city: a.city ?? "" };
    },
    async () => {
      const a = await getAgencyById(id);
      if (!a) return null;
      return {
        id: a.id, name: a.name, ownerName: a.ownerName, email: a.email,
        phone: a.phone, gstNumber: a.gstNumber, city: a.city, status: a.status,
      };
    },
  );
}

export function updateAgencyProfile(
  id: string,
  patch: { name?: string; ownerName?: string; phone?: string; gstNumber?: string; city?: string },
): Promise<AgencyProfile | null> {
  return withDb(
    async (db) => {
      await db.agency.update({ where: { id }, data: patch });
      return getAgencyProfile(id);
    },
    () => getAgencyProfile(id),
  );
}

// --- password reset tokens --------------------------------------------------

export function createResetToken(
  agencyId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  return withDb(
    async (db) => {
      await db.agencyResetToken.create({ data: { agencyId, tokenHash, expiresAt } });
    },
    () => {
      resetTokens.set(tokenHash, { agencyId, expiresAt: expiresAt.getTime(), used: false });
    },
  );
}

/** Validate + consume a reset token; returns the agencyId when valid. */
export function consumeResetToken(tokenHash: string): Promise<string | null> {
  return withDb(
    async (db) => {
      const row = await db.agencyResetToken.findUnique({ where: { tokenHash } });
      if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
      await db.agencyResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } });
      return row.agencyId;
    },
    () => {
      const row = resetTokens.get(tokenHash);
      if (!row || row.used || row.expiresAt < Date.now()) return null;
      row.used = true;
      return row.agencyId;
    },
  );
}
