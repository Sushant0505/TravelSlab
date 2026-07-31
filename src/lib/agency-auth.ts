/**
 * Agency authentication primitives — bcrypt password hashing + password-reset
 * token helpers. Server-only (used from Node route handlers).
 */

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(password, hash);
}

/** SHA-256 hex — used to store only the hash of a reset token. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** A one-time reset token: raw value goes in the link, only the hash is stored. */
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: sha256(token) };
}

/** Reset links are valid for one hour. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
