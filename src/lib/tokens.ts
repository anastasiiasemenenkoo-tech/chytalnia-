import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * One-time links (password reset, email change). The raw token travels in the
 * email; only its hash is stored, so a leaked database row can't be replayed
 * as a link.
 */
export function createToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
