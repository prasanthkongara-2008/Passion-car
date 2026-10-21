import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  customerInputSchema,
  galleryItemInputSchema,
  inquiryInputSchema,
  serviceBookingInputSchema,
  settingsInputSchema,
  vehicleInputSchema,
  vehicleSuggestionSchema,
} from "@shared/schema";
import {
  ALLOWED_ADMINS,
  createAdminSession,
  createAdminSessionWithDetails,
  destroySession,
  getAdminUser,
  requireAdmin,
  verifySessionToken,
} from "./auth";
import { sendOtpEmail } from "./mailer";
import { dynamoStore as storage } from "./dynamodb";
import {
  generateSecureOtp,
  generateSecureToken,
  hashPassword,
  sanitizePlainString,
  sanitizeText,
  timingSafeStringEqual,
  verifyPassword,
} from "./security";

export const api = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many authentication requests. Please try again after 15 minutes." },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many upload requests. Please try again later." },
});

const inquiryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many inquiries submitted. Please wait a few minutes." },
});

const customerAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many customer sign-in attempts. Please try again later." },
});

const DEFAULT_ADMIN_HASHES: Record<string, string> = {
  "passioncar877@gmail.com": hashPassword("passioncar877"),
  "kongaraprasanth25niat@gmail.com": hashPassword("passiondev2026"),
  "hirlume.info@gmail.com": hashPassword("passiondev2026"),
};

api.post("/upload", uploadLimiter, async (req, res) => {
  try {
    const { image, name } = req.body || {};
    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "Image data is required (data URL or base64)." });
      return;
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = "jpg";

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else {
        res.status(400).json({ error: "Invalid image format. Allowed formats: PNG, WebP, JPG." });
        return;
      }
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: "File size exceeds 10MB limit." });
      return;
    }

    const rawName = name ? sanitizePlainString(name).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) : "vehicle";
    const filename = `${rawName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    res.json({ success: true, url: publicUrl, filename });
  } catch (error) {
    res.status(500).json({ error: "Upload failed." });
  }
});

api.post("/upload-multiple", uploadLimiter, async (req, res) => {
  try {
    const { images } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: "An array of image payloads is required." });
      return;
    }

    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const urls: string[] = [];
    for (const item of images.slice(0, 13)) {
      const dataStr = typeof item === "string" ? item : item?.image;
      const name = typeof item === "object" ? item?.name : "photo";
      if (!dataStr || typeof dataStr !== "string") continue;

      const matches = dataStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = "jpg";

      if (matches && matches.length === 3) {
        const mime = matches[1].toLowerCase();
        if (mime.includes("png")) ext = "png";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
        else continue;
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(dataStr, "base64");
      }

      if (buffer.length > 10 * 1024 * 1024) continue;

      const rawName = name ? sanitizePlainString(name).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) : "car";
      const filename = `${rawName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);
      urls.push(`/uploads/${filename}`);
    }

    res.json({ success: true, urls });
  } catch (error) {
    res.status(500).json({ error: "Multi-upload failed." });
  }
});

function asNumber(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

api.get("/health", async (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const magicStore = new Map<string, { email: string; expiresAt: number }>();
const twoFactorStore = new Map<string, {
  email: string;
  name: string;
  role: string;
  method: "google" | "password" | "select";
  otp: string;
  magicToken: string;
  magicUrl: string;
  expiresAt: number;
}>();

api.post("/auth/two-step/init", authLimiter, async (req, res) => {
  try {
    const { method, email, password } = req.body || {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Admin email is required." });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const admin = getAdminUser(normalizedEmail);
    if (!admin) {
      res.status(403).json({
        error: `Account (${normalizedEmail}) is not an authorized administrator. Authorized: passioncar877@gmail.com (Owner), kongaraprasanth25niat@gmail.com (Owner), hirlume.info@gmail.com (Administrator).`,
      });
      return;
    }

    const currentSettings = await (storage as any).getSettings();

    if (method === "password") {
      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "Password is required." });
        return;
      }

      let passwordValid = false;
      const cleanPassword = password.trim();

      if (currentSettings?.adminPasswordHash) {
        passwordValid = verifyPassword(cleanPassword, currentSettings.adminPasswordHash);
      } else if (currentSettings?.adminPassword) {
        passwordValid = verifyPassword(cleanPassword, currentSettings.adminPassword);
      }

      if (!passwordValid && process.env.ADMIN_PASSWORD) {
        passwordValid = verifyPassword(cleanPassword, process.env.ADMIN_PASSWORD);
      }

      if (!passwordValid && DEFAULT_ADMIN_HASHES[admin.email]) {
        passwordValid = verifyPassword(cleanPassword, DEFAULT_ADMIN_HASHES[admin.email]);
      }

      if (!passwordValid) {
        res.status(401).json({
          error: "Incorrect password. Please verify your administrator credentials.",
        });
        return;
      }
    }

    const otp = generateSecureOtp();
    const tfaToken = generateSecureToken("tfa", 24);
    const magicToken = generateSecureToken("magic", 20);
    const host = req.get("host") || (process.env.NODE_ENV === "production" ? "www.passioncar.in" : "localhost:5000");
    const protocol = req.headers["x-forwarded-proto"] === "https" || req.protocol === "https" || process.env.NODE_ENV === "production" ? "https" : req.protocol || "http";
    const magicUrl = `${protocol}://${host}/admin?magic=${magicToken}`;

    twoFactorStore.set(tfaToken, {
      email: admin.email,
      name: admin.name,
      role: admin.role,
      method: method || "select",
      otp,
      magicToken,
      magicUrl,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    magicStore.set(magicToken, {
      email: admin.email,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    try {
      await sendOtpEmail({
        to: admin.email,
        name: admin.name,
        otp,
        magicUrl,
        role: admin.role,
      });
    } catch (_) {}

    res.json({
      success: true,
      requireStep2: true,
      twoFactorToken: tfaToken,
      email: admin.email,
      role: admin.role,
      adminName: admin.name,
      message: `Step 1 Passed! Security OTP and Magic URL sent to ${admin.email}.`,
    });
  } catch (error) {
    res.status(500).json({ error: "Authentication initiation failed." });
  }
});

api.post("/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || typeof email !== "string" || !newPassword || typeof newPassword !== "string") {
      res.status(400).json({ error: "Email and new password are required." });
      return;
    }
    const admin = getAdminUser(email);
    if (!admin) {
      res.status(403).json({ error: "Unauthorized administrator account." });
      return;
    }
    const inputOtp = (otp || "").trim();
    const stored = otpStore.get(admin.email.toLowerCase());
    if (!stored || stored.expiresAt < Date.now() || !timingSafeStringEqual(inputOtp, stored.otp)) {
      res.status(401).json({ error: "Invalid or expired OTP code. Please request a new security OTP." });
      return;
    }

    otpStore.delete(admin.email.toLowerCase());
    const hashed = hashPassword(newPassword.trim());
    await (storage as any).updateSettings({ adminPassword: hashed, adminPasswordHash: hashed });
    res.json({ success: true, message: "Password updated successfully! You can now sign in with your new password." });
  } catch (error) {
    res.status(500).json({ error: "Password reset failed." });
  }
});

api.post("/auth/two-step/verify", authLimiter, async (req, res) => {
  try {
    const { twoFactorToken, otp, magicUrl, magicToken } = req.body || {};
    if (!twoFactorToken || typeof twoFactorToken !== "string") {
      res.status(400).json({ error: "Two-step session token is required. Please complete Step 1 first." });
      return;
    }

    const tfaSession = twoFactorStore.get(twoFactorToken);
    if (!tfaSession || tfaSession.expiresAt < Date.now()) {
      twoFactorStore.delete(twoFactorToken);
      res.status(401).json({ error: "Two-step verification session expired. Please sign in again from Step 1." });
      return;
    }

    let verified = false;

    if (otp && typeof otp === "string") {
      const cleanOtp = otp.trim();
      if (timingSafeStringEqual(cleanOtp, tfaSession.otp)) {
        verified = true;
      }
    }

    if (!verified && (magicUrl || magicToken)) {
      const inputStr = String(magicUrl || magicToken).trim();
      if (timingSafeStringEqual(inputStr, tfaSession.magicToken) || inputStr.includes(tfaSession.magicToken)) {
        verified = true;
      }
    }

    if (!verified) {
      res.status(401).json({
        error: "Invalid verification code. Please enter the correct 6-digit OTP code sent to your email.",
      });
      return;
    }

    twoFactorStore.delete(twoFactorToken);

    const currentSettings = await (storage as any).getSettings();
    const adminUser = {
      email: tfaSession.email,
      role: tfaSession.role,
      name: (tfaSession.email === "passioncar877@gmail.com" ? currentSettings.adminName : null) || tfaSession.name,
    };

    const session = createAdminSessionWithDetails(adminUser);
    res.json({
      success: true,
      token: session.token,
      user: {
        ...session.user,
        photo: (tfaSession.email === "passioncar877@gmail.com" ? currentSettings.adminPhoto : "") || "",
        phone: (tfaSession.email === "passioncar877@gmail.com" ? currentSettings.adminPhone : "+91 88858 58380") || "+91 88858 58380",
      },
      message: "Two-step verification successful! Access granted.",
    });
  } catch (error) {
    res.status(500).json({ error: "Two-step verification failed." });
  }
});

api.post("/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const admin = getAdminUser(email);
    if (!admin) {
      res.status(403).json({
        error: "This email is not authorized as an administrator. Use passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, or hirlume.info@gmail.com",
      });
      return;
    }

    const currentSettings = await (storage as any).getSettings();
    let passwordValid = false;
    const cleanPassword = (password || "").trim();

    if (currentSettings?.adminPasswordHash) {
      passwordValid = verifyPassword(cleanPassword, currentSettings.adminPasswordHash);
    } else if (currentSettings?.adminPassword) {
      passwordValid = verifyPassword(cleanPassword, currentSettings.adminPassword);
    }

    if (!passwordValid && process.env.ADMIN_PASSWORD) {
      passwordValid = verifyPassword(cleanPassword, process.env.ADMIN_PASSWORD);
    }

    if (!passwordValid && DEFAULT_ADMIN_HASHES[admin.email]) {
      passwordValid = verifyPassword(cleanPassword, DEFAULT_ADMIN_HASHES[admin.email]);
    }

    if (!passwordValid) {
      res.status(401).json({
        error: "Incorrect password. Please verify your credentials.",
      });
      return;
    }

    const session = createAdminSession(admin.email);
    res.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

api.post("/auth/google", authLimiter, async (req, res) => {
  try {
    const { email, credential, name, photo } = req.body || {};

    let targetEmail = (email || "").trim().toLowerCase();
    let targetName = sanitizePlainString(name || "");
    let targetPhoto = sanitizePlainString(photo || "");

    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length >= 2) {
          let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          while (b64.length % 4 !== 0) b64 += "=";
          const decoded = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
          if (decoded.email) {
            targetEmail = String(decoded.email).trim().toLowerCase();
            if (decoded.name) targetName = sanitizePlainString(decoded.name);
            if (decoded.picture) targetPhoto = sanitizePlainString(decoded.picture);
          }
        }
      } catch (_) {}
    }

    if (!targetEmail) {
      res.status(400).json({ error: "Google verification token or email is required." });
      return;
    }

    const admin = getAdminUser(targetEmail);
    if (!admin) {
      res.status(403).json({
        error: `Access Denied: The Google account (${targetEmail}) is not authorized for administration. Authorized accounts: passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, hirlume.info@gmail.com`,
      });
      return;
    }

    const session = createAdminSession(admin.email);
    res.json({
      success: true,
      token: session.token,
      user: {
        ...session.user,
        name: targetName || session.user.name,
        photo: targetPhoto || "",
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Google sign-in failed." });
  }
});

api.post("/customer/pin-login", customerAuthLimiter, async (req, res) => {
  try {
    const { phone, name } = req.body || {};
    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Mobile number is required." });
      return;
    }
    const cleanPhone = sanitizePlainString(phone);
    const cleanDigits = cleanPhone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
      return;
    }

    const customer = {
      id: `cust_${cleanDigits}`,
      name: sanitizePlainString(name || "Customer"),
      phone: cleanPhone,
      email: "",
      photo: "",
    };

    try {
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) => c.phone.replace(/\D/g, "") === cleanDigits);
      if (!existing && cleanDigits.length >= 10) {
        await (storage as any).createCustomer({
          name: customer.name,
          phone: cleanPhone,
          email: "",
          transactionType: "current_buyer",
          carModel: "Customer Account",
          regNumber: "",
          amountInr: 0,
          date: new Date().toISOString().split("T")[0],
          status: "in_progress",
          notes: "Customer signed in directly with mobile number.",
        });
      }
    } catch (_) {}

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({ error: "Customer login failed." });
  }
});

api.post("/customer/google-login", customerAuthLimiter, async (req, res) => {
  try {
    const { email, name, photo } = req.body || {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Google account email is required." });
      return;
    }

    const cleanEmail = sanitizePlainString(email).toLowerCase();
    const cleanName = sanitizePlainString(name || cleanEmail.split("@")[0]);

    const customer = {
      id: `cust_${cleanEmail.split("@")[0]}`,
      name: cleanName,
      phone: "",
      email: cleanEmail,
      photo: sanitizePlainString(photo || ""),
    };

    try {
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) => c.email && c.email.toLowerCase() === cleanEmail);
      if (!existing) {
        await (storage as any).createCustomer({
          name: customer.name,
          phone: "",
          email: cleanEmail,
          transactionType: "current_buyer",
          carModel: "Google Account User",
          regNumber: "",
          amountInr: 0,
          date: new Date().toISOString().split("T")[0],
          status: "in_progress",
          notes: "Customer authenticated with Google OAuth.",
        });
      }
    } catch (_) {}

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({ error: "Google customer login failed." });
  }
});

api.put("/customer/profile", async (req, res) => {
  try {
    const { id, name, phone, email, photo, password } = req.body || {};
    if (!id) {
      res.status(400).json({ error: "Customer ID is required." });
      return;
    }

    const updatedCustomer = {
      id: sanitizePlainString(id),
      name: sanitizePlainString(name || ""),
      phone: sanitizePlainString(phone || ""),
      email: sanitizePlainString(email || "").toLowerCase(),
      photo: sanitizePlainString(photo || ""),
    };

    try {
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) =>
        (c.email && c.email.toLowerCase() === updatedCustomer.email) ||
        (c.phone && c.phone.replace(/\D/g, "") === updatedCustomer.phone.replace(/\D/g, "")) ||
        String(c.id) === String(id).replace("cust_", "")
      );
      if (existing) {
        const updatePayload: any = {
          name: updatedCustomer.name,
          phone: updatedCustomer.phone,
          email: updatedCustomer.email,
        };
        if (password && typeof password === "string" && password.trim().length >= 6) {
          updatePayload.notes = `${existing.notes || ""}\n[Password Hash: ${hashPassword(password.trim())}]`;
        }
        await (storage as any).updateCustomer(existing.id, updatePayload);
      }
    } catch (_) {}

    res.json({
      success: true,
      customer: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({ error: "Profile update failed." });
  }
});

api.post("/customer/reset-password", customerAuthLimiter, async (req, res) => {
  try {
    const { identifier, newPassword, userId } = req.body || {};
    if (!identifier && !userId) {
      res.status(400).json({ error: "Email or mobile number is required." });
      return;
    }
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }

    const cleanIdentifier = sanitizePlainString(identifier || "").toLowerCase();
    const cleanPhone = cleanIdentifier.replace(/\D/g, "");
    const hashed = hashPassword(String(newPassword).trim());

    try {
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) =>
        (c.email && c.email.toLowerCase() === cleanIdentifier) ||
        (cleanPhone.length >= 10 && c.phone && c.phone.replace(/\D/g, "") === cleanPhone) ||
        (userId && String(c.id) === String(userId).replace("cust_", ""))
      );
      if (existing) {
        await (storage as any).updateCustomer(existing.id, {
          notes: `${existing.notes || ""}\n[Password Hash: ${hashed}]`,
        });
      }
    } catch (_) {}

    res.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: "Password reset failed." });
  }
});

api.post("/customer/login-password", customerAuthLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      res.status(400).json({ error: "Please enter your email/mobile and password." });
      return;
    }
    const clean = sanitizePlainString(identifier);
    const isEmail = clean.includes("@");
    const name = isEmail ? clean.split("@")[0] : `Customer ${clean.slice(-4)}`;
    const phone = isEmail ? "" : clean;
    const email = isEmail ? clean.toLowerCase() : `${clean}@passioncar.in`;

    const customer = {
      id: `cust_${Date.now()}`,
      name,
      phone,
      email,
      photo: "",
    };

    try {
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) =>
        (c.email && c.email.toLowerCase() === clean.toLowerCase()) ||
        (c.phone && c.phone.replace(/\D/g, "") === clean.replace(/\D/g, ""))
      );
      if (existing) {
        if (existing.notes && existing.notes.includes("[Password Hash: ")) {
          const match = existing.notes.match(/\[Password Hash:\s*([^\s\]]+)\]/);
          if (match && match[1]) {
            const valid = verifyPassword(String(password).trim(), match[1]);
            if (!valid) {
              res.status(401).json({ error: "Incorrect password. Please verify your credentials." });
              return;
            }
          }
        }
        customer.id = `cust_${existing.id}`;
        customer.name = existing.name || customer.name;
        customer.phone = existing.phone || customer.phone;
        customer.email = existing.email || customer.email;
      }
    } catch (_) {}

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed." });
  }
});

api.get("/customer/my-activity", async (req, res) => {
  try {
    const rawPhone = typeof req.query.phone === "string" ? req.query.phone.trim().replace(/\D/g, "") : "";
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";

    if (!phone && !email) {
      res.json({
        inquiries: [],
        serviceBookings: [],
        customers: [],
      });
      return;
    }

    const allInquiries = await storage.getInquiries();
    const allBookings = await (storage as any).getServiceBookings();
    const allCustomers = await (storage as any).getCustomers();

    const matchingPhones = new Set<string>();
    const matchingEmails = new Set<string>();
    if (phone) matchingPhones.add(phone);
    if (email) matchingEmails.add(email);

    const myInquiries = allInquiries.filter((inq) => {
      const p = (inq.phone || "").replace(/\D/g, "").slice(-10);
      const e = (inq.email || "").toLowerCase();
      return (p && matchingPhones.has(p)) || (e && matchingEmails.has(e));
    });

    const myBookings = allBookings.filter((b: any) => {
      const p = (b.phone || "").replace(/\D/g, "").slice(-10);
      const e = (b.email || "").toLowerCase();
      return (p && matchingPhones.has(p)) || (e && matchingEmails.has(e));
    });

    const myCustomers = (allCustomers || []).filter((c: any) => {
      const p = (c.phone || "").replace(/\D/g, "").slice(-10);
      const e = (c.email || "").toLowerCase();
      return (p && matchingPhones.has(p)) || (e && matchingEmails.has(e));
    });

    res.json({
      inquiries: myInquiries,
      serviceBookings: myBookings,
      customers: myCustomers,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load customer activity." });
  }
});

api.post("/auth/otp/send", authLimiter, async (req, res) => {
  try {
    const { phone, email } = req.body || {};
    let targetAdmin = null;

    if (email && typeof email === "string") {
      targetAdmin = getAdminUser(email);
    }

    const digits = (phone || "").replace(/\D/g, "");
    if (!targetAdmin && (digits.endsWith("8885858380") || digits === "8885858380")) {
      targetAdmin = getAdminUser("passioncar877@gmail.com");
    }

    if (!targetAdmin) {
      res.status(403).json({ error: "Access Denied: Only authorized administrators are permitted." });
      return;
    }

    const otp = generateSecureOtp();
    const expiry = Date.now() + 10 * 60_000;
    otpStore.set(targetAdmin.email.toLowerCase(), { otp, expiresAt: expiry });
    if (digits) {
      otpStore.set(digits, { otp, expiresAt: expiry });
    }

    try {
      await sendOtpEmail({
        to: targetAdmin.email,
        name: targetAdmin.name,
        otp,
        role: targetAdmin.role,
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Security OTP sent to ${targetAdmin.email}.`,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP." });
  }
});

api.post("/auth/otp/verify", authLimiter, async (req, res) => {
  try {
    const { phone, email, otp } = req.body || {};
    if (!otp) {
      res.status(400).json({ error: "OTP code is required." });
      return;
    }

    let targetAdmin = null;
    if (email && typeof email === "string") {
      targetAdmin = getAdminUser(email);
    }

    const digits = (phone || "").replace(/\D/g, "");
    if (!targetAdmin && (digits.endsWith("8885858380") || digits === "8885858380")) {
      targetAdmin = getAdminUser("passioncar877@gmail.com");
    }

    if (!targetAdmin) {
      res.status(403).json({ error: "Access Denied: Only authorized administrators are permitted." });
      return;
    }

    const stored = otpStore.get(targetAdmin.email.toLowerCase()) || (digits ? otpStore.get(digits) : null);

    if (!stored || stored.expiresAt < Date.now() || !timingSafeStringEqual(String(otp).trim(), stored.otp)) {
      res.status(401).json({ error: "Invalid or expired OTP." });
      return;
    }

    otpStore.delete(targetAdmin.email.toLowerCase());
    if (digits) otpStore.delete(digits);

    const session = createAdminSession(targetAdmin.email);
    res.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (error) {
    res.status(500).json({ error: "OTP verification failed." });
  }
});

api.post("/auth/magic-link/generate", authLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    const adminEmail = email && typeof email === "string" ? email.trim().toLowerCase() : "passioncar877@gmail.com";
    const admin = getAdminUser(adminEmail);
    if (!admin) {
      res.status(403).json({ error: "Email not authorized." });
      return;
    }

    const token = generateSecureToken("magic", 24);
    magicStore.set(token, { email: admin.email, expiresAt: Date.now() + 15 * 60_000 });

    const host = req.get("host") || (process.env.NODE_ENV === "production" ? "www.passioncar.in" : "localhost:5000");
    const protocol = req.headers["x-forwarded-proto"] === "https" || req.protocol === "https" || process.env.NODE_ENV === "production" ? "https" : req.protocol || "http";
    const magicUrl = `${protocol}://${host}/admin?magic=${token}`;

    try {
      await sendOtpEmail({
        to: admin.email,
        name: admin.name,
        otp: "MAGIC-LINK",
        magicUrl,
        role: admin.role,
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `A secure sign-in link has been sent to ${admin.email}.`,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate magic link." });
  }
});

api.post("/auth/magic-link/verify", authLimiter, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") {
      res.status(400).json({ error: "Token is required." });
      return;
    }

    const stored = magicStore.get(token);
    if (!stored || stored.expiresAt < Date.now()) {
      res.status(401).json({ error: "Magic link is invalid or has expired." });
      return;
    }

    magicStore.delete(token);
    const session = createAdminSession(stored.email);
    res.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (error) {
    res.status(500).json({ error: "Magic link verification failed." });
  }
});

api.get("/auth/session", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    (req.headers["x-admin-token"] as string | undefined);

  if (!token) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const session = verifySessionToken(token);
  if (!session) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const settings = await (storage as any).getSettings();

  res.json({
    authenticated: true,
    user: {
      email: session.email,
      role: session.role,
      name:
        session.email === "passioncar877@gmail.com"
          ? (settings.adminName || "Mohammed Akbar (Owner)")
          : session.email === "hirlume.info@gmail.com"
          ? "Prasanth Kongara (Administrator)"
          : (session.name || "Prasanth Kongara (Developer)"),
      photo: session.email === "passioncar877@gmail.com" ? (settings.adminPhoto || "") : "",
      phone: session.email === "passioncar877@gmail.com" ? (settings.adminPhone || "+91 88858 58380") : "+91 88858 58380",
    },
  });
});

api.post("/auth/switch-profile", requireAdmin, async (req, res) => {
  try {
    const { targetEmail } = req.body || {};
    const admin = getAdminUser(targetEmail);
    if (!admin) {
      res.status(403).json({ error: "Unauthorized target profile." });
      return;
    }
    const session = createAdminSession(admin.email);
    res.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to switch admin profile." });
  }
});

api.post("/auth/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) destroySession(token);
  res.json({ success: true });
});

api.get("/vehicles", async (req, res, next) => {
  try {
    const filters = {
      search: typeof req.query.search === "string" ? sanitizePlainString(req.query.search) : undefined,
      brand: typeof req.query.brand === "string" ? sanitizePlainString(req.query.brand) : undefined,
      bodyType: typeof req.query.bodyType === "string" ? sanitizePlainString(req.query.bodyType) : undefined,
      fuelType: typeof req.query.fuelType === "string" ? sanitizePlainString(req.query.fuelType) : undefined,
      transmission: typeof req.query.transmission === "string" ? sanitizePlainString(req.query.transmission) : undefined,
      color: typeof req.query.color === "string" ? sanitizePlainString(req.query.color) : undefined,
      minPrice: asNumber(req.query.minPrice),
      maxPrice: asNumber(req.query.maxPrice),
      yearFrom: asNumber(req.query.yearFrom),
      yearTo: asNumber(req.query.yearTo),
      maxKm: asNumber(req.query.maxKm),
      sort: typeof req.query.sort === "string" ? sanitizePlainString(req.query.sort) : undefined,
      includeSold: req.query.includeSold === "true",
    };

    const vehicles = await storage.getVehicles(filters);
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
});

api.get("/vehicles/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid vehicle ID." });
      return;
    }
    const vehicle = await storage.getVehicle(id);
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found." });
      return;
    }
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

api.get("/gallery", async (req, res, next) => {
  try {
    const category = typeof req.query.category === "string" ? sanitizePlainString(req.query.category) : undefined;
    const items = await storage.getGallery(category);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

api.post("/inquiries", inquiryLimiter, async (req, res, next) => {
  try {
    const sanitizedBody = {
      ...req.body,
      name: sanitizePlainString(req.body?.name),
      phone: sanitizePlainString(req.body?.phone),
      email: req.body?.email ? sanitizePlainString(req.body?.email) : "",
      message: sanitizePlainString(req.body?.message || ""),
    };
    const parsed = inquiryInputSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
      res.status(400).json({ error: "Please enter your name, valid phone number, and details." });
      return;
    }
    const inquiry = await storage.createInquiry(parsed.data);

    try {
      const cleanDigits = parsed.data.phone.replace(/\D/g, "");
      const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) => {
        const d = (c.phone || "").replace(/\D/g, "");
        return (d.length >= 10 ? d.slice(-10) : d) === cleanPhone;
      });
      if (!existing && cleanPhone.length >= 10) {
        await (storage as any).createCustomer({
          name: parsed.data.name,
          phone: parsed.data.phone,
          email: parsed.data.email || "",
          transactionType: "current_buyer",
          carModel: parsed.data.vehicleId ? `Vehicle #${parsed.data.vehicleId}` : `Inquiry (${parsed.data.type})`,
          regNumber: "",
          amountInr: 0,
          date: new Date().toISOString().split("T")[0],
          status: "in_progress",
          notes: `[Online Inquiry: ${parsed.data.type.toUpperCase()}] ${parsed.data.message || ""}`,
        });
      } else if (existing) {
        const updatedNotes = `${existing.notes || ""} | [Online Inquiry: ${parsed.data.type.toUpperCase()}] ${parsed.data.message || ""}`.trim();
        await (storage as any).updateCustomer(existing.id, { notes: updatedNotes });
      }
    } catch (_) {}

    res.status(201).json(inquiry);
  } catch (error) {
    next(error);
  }
});

api.get("/settings", async (_req, res, next) => {
  try {
    const settings = await (storage as any).getSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

api.get("/google-rating", async (_req, res) => {
  const settings = await (storage as any).getSettings();
  const rating = Number(settings.googleRating) || 4.9;
  const reviewCount = Number(settings.googleReviewsCount) || 148;
  const hours = `${settings.showroomHoursMonSat || "Open Mon-Sat 10:00 AM - 8:30 PM"}, ${settings.showroomHoursSun || "Sun 10:30 AM - 7:00 PM"}`;
  res.json({
    name: "Passion Car",
    rating,
    reviewCount,
    justdialRating: 4.8,
    justdialVotes: 120,
    address:
      settings.address ||
      "Plot No: 25, 100 Feet Rd, Sri Rama Colony, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081",
    phone: settings.phone || "+91 88858 58380",
    url: "https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7",
    hours,
    fetchedAt: new Date().toISOString(),
  });
});

api.get("/reviews", async (_req, res, next) => {
  try {
    const list = await (storage as any).getReviews();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

api.post("/reviews", inquiryLimiter, async (req, res, next) => {
  try {
    const { authorName, rating, text, carModel } = req.body || {};
    if (!authorName || !text) {
      res.status(400).json({ error: "Name and review text are required." });
      return;
    }
    const created = await (storage as any).addReview({
      authorName: sanitizePlainString(authorName),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      text: sanitizePlainString(text),
      relativeTime: "Just now",
      verified: true,
      carModel: carModel ? sanitizePlainString(carModel) : undefined,
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

api.get("/vehicle-suggestions", async (req, res, next) => {
  try {
    const parsed = vehicleSuggestionSchema.safeParse({
      make: typeof req.query.make === "string" ? sanitizePlainString(req.query.make) : undefined,
      model: typeof req.query.model === "string" ? sanitizePlainString(req.query.model) : undefined,
      variant: typeof req.query.variant === "string" ? sanitizePlainString(req.query.variant) : undefined,
      year: asNumber(req.query.year),
      fuelType: req.query.fuelType,
    });

    if (!parsed.success) {
      res.status(400).json({ error: "Provide a valid make, model, and fuel type." });
      return;
    }

    const suggestion = await storage.getVehicleSuggestions(
      parsed.data.make,
      parsed.data.model,
      parsed.data.fuelType
    );
    res.json(suggestion);
  } catch (error) {
    next(error);
  }
});

api.get("/admin/summary", requireAdmin, async (_req, res, next) => {
  try {
    const allVehicles = await storage.getVehicles({ includeSold: true });
    const available = allVehicles.filter((v) => v.status === "available").length;
    const sold = allVehicles.filter((v) => v.status === "sold").length;
    const inquiries = await storage.getInquiries();
    const carsSold = await storage.getCarsSold();
    const gallery = await storage.getGallery();
    const customers = await (storage as any).getCustomers();
    const serviceBookings = await (storage as any).getServiceBookings();

    res.json({
      totalVehicles: allVehicles.length,
      availableVehicles: available,
      soldVehicles: sold,
      carsSoldCounter: carsSold,
      totalInquiries: inquiries.length,
      pendingInquiries: inquiries.filter((i) => i.status === "new").length,
      galleryItemsCount: gallery.length,
      admins: ALLOWED_ADMINS,
      totalCustomers: customers.length,
      totalServiceBookings: serviceBookings.length,
      pendingServiceBookings: serviceBookings.filter((b: any) => b.status === "confirmed" || b.status === "new" || !b.status || b.status === "pending").length,
    });
  } catch (error) {
    next(error);
  }
});

api.post("/admin/vehicles", requireAdmin, async (req, res, next) => {
  try {
    const parsed = vehicleInputSchema.safeParse(req.body);
    if (!parsed.success) {
      const issueMsg = parsed.error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join(", ");
      res.status(400).json({
        error: `Car validation failed: ${issueMsg}`,
        issues: parsed.error.issues,
      });
      return;
    }
    const sanitizedVehicle = {
      ...parsed.data,
      make: sanitizePlainString(parsed.data.make),
      model: sanitizePlainString(parsed.data.model),
      variant: sanitizePlainString(parsed.data.variant),
      color: sanitizePlainString(parsed.data.color),
      city: sanitizePlainString(parsed.data.city),
      engineType: sanitizePlainString(parsed.data.engineType),
      description: sanitizePlainString(parsed.data.description),
      features: parsed.data.features.map((f) => sanitizePlainString(f)),
    };
    const created = await storage.createVehicle(sanitizedVehicle);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

api.put("/admin/vehicles/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid vehicle ID." });
      return;
    }
    const parsed = vehicleInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Check updated car fields." });
      return;
    }
    const sanitizedUpdate: any = { ...parsed.data };
    if (parsed.data.make) sanitizedUpdate.make = sanitizePlainString(parsed.data.make);
    if (parsed.data.model) sanitizedUpdate.model = sanitizePlainString(parsed.data.model);
    if (parsed.data.variant !== undefined) sanitizedUpdate.variant = sanitizePlainString(parsed.data.variant);
    if (parsed.data.color !== undefined) sanitizedUpdate.color = sanitizePlainString(parsed.data.color);
    if (parsed.data.city) sanitizedUpdate.city = sanitizePlainString(parsed.data.city);
    if (parsed.data.engineType !== undefined) sanitizedUpdate.engineType = sanitizePlainString(parsed.data.engineType);
    if (parsed.data.description !== undefined) sanitizedUpdate.description = sanitizePlainString(parsed.data.description);
    if (parsed.data.features) sanitizedUpdate.features = parsed.data.features.map((f) => sanitizePlainString(f));

    const updated = await storage.updateVehicle(id, sanitizedUpdate);
    if (!updated) {
      res.status(404).json({ error: "Vehicle not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.delete("/admin/vehicles/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid vehicle ID." });
      return;
    }
    const success = await storage.deleteVehicle(id);
    if (!success) {
      res.status(404).json({ error: "Vehicle not found." });
      return;
    }
    res.json({ success: true, message: "Vehicle removed successfully." });
  } catch (error) {
    next(error);
  }
});

api.get("/admin/gallery", requireAdmin, async (_req, res, next) => {
  try {
    const items = await storage.getGallery();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

api.post("/admin/gallery", requireAdmin, async (req, res, next) => {
  try {
    const parsed = galleryItemInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Provide a title and valid image URL for gallery item." });
      return;
    }
    const sanitized = {
      ...parsed.data,
      title: sanitizePlainString(parsed.data.title),
      category: sanitizePlainString(parsed.data.category),
      caption: sanitizePlainString(parsed.data.caption),
    };
    const item = await storage.createGalleryItem(sanitized);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

api.put("/admin/gallery/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid gallery item ID." });
      return;
    }
    const parsed = galleryItemInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid gallery update payload." });
      return;
    }
    const sanitized: any = { ...parsed.data };
    if (parsed.data.title) sanitized.title = sanitizePlainString(parsed.data.title);
    if (parsed.data.category) sanitized.category = sanitizePlainString(parsed.data.category);
    if (parsed.data.caption !== undefined) sanitized.caption = sanitizePlainString(parsed.data.caption);

    const updated = await storage.updateGalleryItem(id, sanitized);
    if (!updated) {
      res.status(404).json({ error: "Gallery item not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.delete("/admin/gallery/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid gallery item ID." });
      return;
    }
    const success = await storage.deleteGalleryItem(id);
    if (!success) {
      res.status(404).json({ error: "Gallery item not found." });
      return;
    }
    res.json({ success: true, message: "Gallery item deleted." });
  } catch (error) {
    next(error);
  }
});

api.put("/admin/settings", requireAdmin, async (req, res, next) => {
  try {
    const parsed = settingsInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Check settings payload." });
      return;
    }
    const sanitized: any = { ...parsed.data };
    if (parsed.data.address) sanitized.address = sanitizePlainString(parsed.data.address);
    if (parsed.data.adminName) sanitized.adminName = sanitizePlainString(parsed.data.adminName);
    if (parsed.data.showroomHoursMonSat) sanitized.showroomHoursMonSat = sanitizePlainString(parsed.data.showroomHoursMonSat);
    if (parsed.data.showroomHoursSun) sanitized.showroomHoursSun = sanitizePlainString(parsed.data.showroomHoursSun);

    const updatedSettings = await (storage as any).updateSettings(sanitized);
    res.json({ success: true, ...updatedSettings });
  } catch (error) {
    next(error);
  }
});

api.get("/admin/inquiries", requireAdmin, async (_req, res, next) => {
  try {
    const list = await storage.getInquiries();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

api.patch("/admin/inquiries/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, confirmedSlotTime, slotConfirmed } = req.body || {};
    if (!Number.isInteger(id) || id < 1 || !["new", "contacted", "completed", "closed"].includes(status)) {
      res.status(400).json({ error: "Provide a valid inquiry status (new, contacted, completed, closed)." });
      return;
    }
    const updated = await storage.updateInquiryStatus(
      id,
      status,
      confirmedSlotTime ? sanitizePlainString(confirmedSlotTime) : undefined,
      typeof slotConfirmed === "boolean" ? slotConfirmed : undefined
    );
    if (!updated) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.delete("/admin/inquiries/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid inquiry ID." });
      return;
    }
    const deleted = await storage.deleteInquiry(id);
    if (!deleted) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

api.post("/admin/inquiries/:id/reply", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { reply, status, confirmedSlotTime, slotConfirmed, repliedBy } = req.body || {};
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid inquiry ID." });
      return;
    }
    if (!reply || typeof reply !== "string" || !reply.trim()) {
      res.status(400).json({ error: "Please enter your reply message." });
      return;
    }

    const updated = await storage.replyToInquiry(id, {
      reply: sanitizePlainString(reply),
      status: status || "contacted",
      confirmedSlotTime: confirmedSlotTime ? sanitizePlainString(confirmedSlotTime) : undefined,
      slotConfirmed: Boolean(slotConfirmed),
      repliedBy: sanitizePlainString(repliedBy || res.locals.adminUser?.name || "Mohammed Akbar (Owner)"),
    });

    if (!updated) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.post("/admin/inquiries/:id/mark-read", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid inquiry ID." });
      return;
    }
    const updated = await storage.markInquiryRead(id);
    if (!updated) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.post("/service-booking", inquiryLimiter, async (req, res, next) => {
  try {
    const sanitizedBody = {
      ...req.body,
      customerName: sanitizePlainString(req.body?.customerName),
      phone: sanitizePlainString(req.body?.phone),
      email: req.body?.email ? sanitizePlainString(req.body?.email) : "",
      carDetails: sanitizePlainString(req.body?.carDetails),
      servicePackage: sanitizePlainString(req.body?.servicePackage || "Periodic Maintenance Service"),
      date: sanitizePlainString(req.body?.date),
      timeSlot: sanitizePlainString(req.body?.timeSlot),
      notes: req.body?.notes ? sanitizePlainString(req.body?.notes) : undefined,
    };

    const parsed = serviceBookingInputSchema.safeParse(sanitizedBody);
    if (!parsed.success) {
      res.status(400).json({
        error: "Please provide your name, phone, car details, date, and preferred time slot.",
        issues: parsed.error.issues,
      });
      return;
    }

    const randToken = `PCS-SRV-${crypto.randomInt(1000, 10000)}`;
    const booking = await (storage as any).createServiceBooking({
      ...parsed.data,
      token: randToken,
    });

    await storage.createInquiry({
      type: "service",
      name: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: `[SERVICE TOKEN: ${randToken}] Package: ${parsed.data.servicePackage} | Date: ${parsed.data.date} | Slot: ${parsed.data.timeSlot} | Car: ${parsed.data.carDetails}${parsed.data.notes ? ` | Notes: ${parsed.data.notes}` : ""}`,
    });

    try {
      const cleanDigits = parsed.data.phone.replace(/\D/g, "");
      const cleanPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) => {
        const d = (c.phone || "").replace(/\D/g, "");
        return (d.length >= 10 ? d.slice(-10) : d) === cleanPhone;
      });
      if (!existing && cleanPhone.length >= 10) {
        await (storage as any).createCustomer({
          name: parsed.data.customerName,
          phone: parsed.data.phone,
          email: parsed.data.email || "",
          transactionType: "current_buyer",
          carModel: parsed.data.carDetails,
          regNumber: "",
          amountInr: 0,
          date: parsed.data.date,
          status: "in_progress",
          notes: `[Service Booking: ${randToken}] ${parsed.data.servicePackage} on ${parsed.data.date} at ${parsed.data.timeSlot}`,
        });
      } else if (existing) {
        const updatedNotes = `${existing.notes || ""} | [Service Token: ${randToken}] ${parsed.data.servicePackage} on ${parsed.data.date}`.trim();
        await (storage as any).updateCustomer(existing.id, {
          notes: updatedNotes,
          carModel: existing.carModel && existing.carModel !== "Customer Account" ? existing.carModel : parsed.data.carDetails,
          date: parsed.data.date,
        });
      }
    } catch (_) {}

    res.status(201).json({
      success: true,
      token: randToken,
      booking,
      message: `Service slot successfully booked! Your official Service Token is ${randToken}.`,
    });
  } catch (error) {
    next(error);
  }
});

api.get("/admin/service-tokens", requireAdmin, async (_req, res, next) => {
  try {
    const list = await (storage as any).getServiceBookings();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

api.patch("/admin/service-tokens/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, date, timeSlot } = req.body || {};
    if (!Number.isInteger(id) || id < 1 || !["confirmed", "in_progress", "completed", "cancelled", "postponed"].includes(status)) {
      res.status(400).json({ error: "Valid status required (confirmed, in_progress, completed, cancelled, postponed)." });
      return;
    }
    const updated = await (storage as any).updateServiceBookingStatus(id, status, date, timeSlot);
    if (!updated) {
      res.status(404).json({ error: "Service booking not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.delete("/admin/service-tokens/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid booking ID." });
      return;
    }
    const deleted = await (storage as any).deleteServiceBooking(id);
    if (!deleted) {
      res.status(404).json({ error: "Service booking not found." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

api.get("/admin/customers", requireAdmin, async (req, res, next) => {
  try {
    const type = typeof req.query.type === "string" ? sanitizePlainString(req.query.type) : undefined;
    const search = typeof req.query.search === "string" ? sanitizePlainString(req.query.search) : undefined;
    const customers = await (storage as any).getCustomers({ type, search });
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

api.post("/admin/customers", requireAdmin, async (req, res, next) => {
  try {
    const parsed = customerInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Please enter client name, phone number, vehicle model, and transaction type.",
        issues: parsed.error.issues,
      });
      return;
    }
    const sanitized = {
      ...parsed.data,
      name: sanitizePlainString(parsed.data.name),
      phone: sanitizePlainString(parsed.data.phone),
      email: parsed.data.email ? sanitizePlainString(parsed.data.email) : undefined,
      carModel: sanitizePlainString(parsed.data.carModel),
      regNumber: parsed.data.regNumber ? sanitizePlainString(parsed.data.regNumber) : undefined,
      notes: parsed.data.notes ? sanitizePlainString(parsed.data.notes) : undefined,
    };
    const created = await (storage as any).createCustomer(sanitized);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

api.put("/admin/customers/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid customer ID." });
      return;
    }
    const parsed = customerInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid customer payload.", issues: parsed.error.issues });
      return;
    }
    const sanitized: any = { ...parsed.data };
    if (parsed.data.name) sanitized.name = sanitizePlainString(parsed.data.name);
    if (parsed.data.phone) sanitized.phone = sanitizePlainString(parsed.data.phone);
    if (parsed.data.email !== undefined) sanitized.email = parsed.data.email ? sanitizePlainString(parsed.data.email) : "";
    if (parsed.data.carModel) sanitized.carModel = sanitizePlainString(parsed.data.carModel);
    if (parsed.data.regNumber !== undefined) sanitized.regNumber = sanitizePlainString(parsed.data.regNumber);
    if (parsed.data.notes !== undefined) sanitized.notes = sanitizePlainString(parsed.data.notes);

    const updated = await (storage as any).updateCustomer(id, sanitized);
    if (!updated) {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

api.delete("/admin/customers/:id", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(400).json({ error: "Invalid customer ID." });
      return;
    }
    const success = await (storage as any).deleteCustomer(id);
    if (!success) {
      res.status(404).json({ error: "Customer not found." });
      return;
    }
    res.json({ success: true, message: "Customer record deleted." });
  } catch (error) {
    next(error);
  }
});

api.use((error: unknown, _req: any, res: any, _next: any) => {
  console.error("API error:", error instanceof Error ? error.message : "unknown error");
  res.status(500).json({ error: "An unexpected error occurred. Please try again." });
});
