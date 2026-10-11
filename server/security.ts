import crypto from "node:crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash || typeof storedHash !== "string") {
    return false;
  }

  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 3) {
      return false;
    }
    const [, salt, expectedHash] = parts;
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    const derivedBuf = Buffer.from(derived, "utf8");
    const expectedBuf = Buffer.from(expectedHash, "utf8");
    if (derivedBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(derivedBuf, expectedBuf);
  }

  const plainBuf = Buffer.from(password, "utf8");
  const targetBuf = Buffer.from(storedHash, "utf8");
  if (plainBuf.length !== targetBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(plainBuf, targetBuf);
}

export function timingSafeStringEqual(a?: string | null, b?: string | null): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function generateSecureToken(prefix = "tok", bytes = 24): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString("hex")}`;
}

export function sanitizeText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/javascript:[^"'\s]*/gi, "")
    .replace(/vbscript:[^"'\s]*/gi, "")
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export function sanitizePlainString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/javascript:[^"'\s]*/gi, "")
    .replace(/vbscript:[^"'\s]*/gi, "")
    .replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}
