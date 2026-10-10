import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

export const ALLOWED_ADMINS = [
  {
    email: "passioncar877@gmail.com",
    role: "owner",
    name: "Mohammed Akbar (Owner)",
  },
  {
    email: "kongaraprasanth25niat@gmail.com",
    role: "developer",
    name: "Prasanth Kongara (Developer)",
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

export function createAdminSession(email: string): { token: string; user: { email: string; role: string; name: string } } {
  const admin = getAdminUser(email);
  if (!admin) {
    throw new Error("Access Denied: Only passioncar877@gmail.com and kongaraprasanth25niat@gmail.com are permitted as administrators.");
  }

  const token = `adm_${crypto.randomBytes(24).toString("hex")}`;
  const sessionData = {
    email: admin.email,
    role: admin.role,
    name: admin.name,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  sessions.set(token, sessionData);
  return { token, user: { email: admin.email, role: admin.role, name: admin.name } };
}

export function createAdminSessionWithDetails(user: { email: string; role: string; name: string }): { token: string; user: { email: string; role: string; name: string } } {
  const admin = getAdminUser(user.email);
  if (!admin) {
    throw new Error("Access Denied: Only passioncar877@gmail.com and kongaraprasanth25niat@gmail.com are permitted as administrators.");
  }
  const token = `adm_${crypto.randomBytes(24).toString("hex")}`;
  const sessionData = {
    email: admin.email,
    role: admin.role,
    name: admin.name,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  sessions.set(token, sessionData);
  return { token, user: { email: admin.email, role: admin.role, name: admin.name } };
}

export function verifySessionToken(token: string) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  const isAllowed = ALLOWED_ADMINS.some((a) => a.email.toLowerCase() === session.email.toLowerCase());
  if (!isAllowed) {
    sessions.delete(token);
    return null;
  }
  return session;
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

  res.status(401).json({ error: "Admin authentication required. Only authorized administrators (passioncar877@gmail.com, kongaraprasanth25niat@gmail.com) may access this resource." });
}
