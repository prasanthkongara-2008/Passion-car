import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import { timingSafeStringEqual } from "./security";

export const ALLOWED_ADMINS = [
  {
    email: "passioncar877@gmail.com",
    role: "owner",
    name: "Mohammed Akbar (Dealership Owner)",
  },
  {
    email: "kongaraprasanth25niat@gmail.com",
    role: "owner",
    name: "Prasanth Kongara (Dealership Owner)",
  },
  {
    email: "hirlume.info@gmail.com",
    role: "owner",
    name: "Prasanth Kongara (Administrator)",
  },
];

const sessions = new Map<
  string,
  {
    email: string;
    role: string;
    name: string;
    expiresAt: number;
  }
>();

export const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
    process.env.CLERK_PUBLISHABLE_KEY &&
    process.env.VITE_CLERK_PUBLISHABLE_KEY,
);

export function getAdminUser(email: string) {
  if (!email || typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return ALLOWED_ADMINS.find((a) => a.email.toLowerCase() === normalized) || null;
}

const AUTH_SECRET = process.env.SESSION_SECRET || "passioncar-admin-secret-session-key-2026-hardened";

function signAdminPayload(payload: string): string {
  return crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
}

export function createAdminSession(email: string): { token: string; user: { email: string; role: string; name: string } } {
  const admin = getAdminUser(email);
  if (!admin) {
    throw new Error("Access Denied: Only passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, and hirlume.info@gmail.com are permitted as administrators.");
  }

  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payload = `${admin.email}|${admin.role}|${expiresAt}`;
  const sig = signAdminPayload(payload);
  const token = `adm_${Buffer.from(payload).toString("base64url")}_${sig}`;
  const sessionData = {
    email: admin.email,
    role: admin.role,
    name: admin.name,
    expiresAt,
  };
  sessions.set(token, sessionData);
  return { token, user: { email: admin.email, role: admin.role, name: admin.name } };
}

export function createAdminSessionWithDetails(user: { email: string; role: string; name: string }): { token: string; user: { email: string; role: string; name: string } } {
  const admin = getAdminUser(user.email);
  if (!admin) {
    throw new Error("Access Denied: Only passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, and hirlume.info@gmail.com are permitted as administrators.");
  }
  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payload = `${admin.email}|${admin.role}|${expiresAt}`;
  const sig = signAdminPayload(payload);
  const token = `adm_${Buffer.from(payload).toString("base64url")}_${sig}`;
  const sessionData = {
    email: admin.email,
    role: admin.role,
    name: admin.name,
    expiresAt,
  };
  sessions.set(token, sessionData);
  return { token, user: { email: admin.email, role: admin.role, name: admin.name } };
}

export function verifySessionToken(token: string) {
  if (!token || typeof token !== "string") return null;
  const session = sessions.get(token);
  if (session && session.expiresAt >= Date.now()) {
    const isAllowed = ALLOWED_ADMINS.some((a) => a.email.toLowerCase() === session.email.toLowerCase());
    if (isAllowed) return session;
  }
  if (token.startsWith("adm_")) {
    const parts = token.slice(4).split("_");
    if (parts.length === 2) {
      try {
        const [b64, sig] = parts;
        const payload = Buffer.from(b64, "base64url").toString("utf8");
        const [email, role, expStr] = payload.split("|");
        const expiresAt = Number(expStr);
        if (expiresAt && expiresAt > Date.now()) {
          const expectedSig = signAdminPayload(payload);
          if (timingSafeStringEqual(sig, expectedSig)) {
            const admin = getAdminUser(email);
            if (admin) {
              const sessionData = { email: admin.email, role: admin.role, name: admin.name, expiresAt };
              sessions.set(token, sessionData);
              return sessionData;
            }
          }
        }
      } catch (_) {}
    }
  }
  return null;
}

export function destroySession(token: string) {
  sessions.delete(token);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const customToken =
    (authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    (req.headers["x-admin-token"] as string | undefined);

  if (customToken) {
    const session = verifySessionToken(customToken);
    if (session) {
      res.locals.adminUser = session;
      res.locals.adminEmail = session.email;
      return next();
    }
  }

  res.status(401).json({ error: "Admin authentication required. Only authorized administrators (passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, hirlume.info@gmail.com) may access this resource." });
}
