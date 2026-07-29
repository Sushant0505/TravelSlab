import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Password hashing with Node's built-in scrypt — no external dependency.
 * Stored format: `scrypt$<saltHex>$<hashHex>`.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(
  password: string,
  stored: string | null | undefined,
): boolean {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
