import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt (cost factor 12).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * Constant-time safe via bcrypt implementation.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return compare(plainPassword, hashedPassword);
}