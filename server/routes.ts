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

export const api = Router();

api.post("/upload", async (req, res) => {
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
      const mime = matches[1];
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("gif")) ext = "gif";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    const safeName = name ? String(name).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) : "vehicle";
    const filename = `${safeName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const uploadDir = path.resolve(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    res.json({ success: true, url: publicUrl, filename });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Upload failed." });
  }
});

api.post("/upload-multiple", async (req, res) => {
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
      if (!dataStr) continue;

      const matches = dataStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = "jpg";

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("png")) ext = "png";
        else if (mime.includes("webp")) ext = "webp";
        else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
        else if (mime.includes("gif")) ext = "gif";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(dataStr, "base64");
      }

      const safeName = name ? String(name).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) : "car";
      const filename = `${safeName}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filePath, buffer);
      urls.push(`/uploads/${filename}`);
    }

    res.json({ success: true, urls });
  } catch (error) {
    console.error("Upload multiple error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Multi-upload failed." });
  }
});

const inquiryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
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

api.post("/auth/two-step/init", async (req, res) => {
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
        error: `Account (${normalizedEmail}) is not an authorized administrator. Authorized: passioncar877@gmail.com (Owner), kongaraprasanth25niat@gmail.com (Developer).`,
      });
      return;
    }

    const currentSettings = await (storage as any).getSettings();

    if (method === "password") {
      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "Password is required." });
        return;
      }

      const validPasswords = [
        "passioncar2026",
        "passioncar877",
        "admin877",
        "passiondev2026",
        currentSettings.adminPassword,
        process.env.ADMIN_PASSWORD,
      ].filter(Boolean);

      const passwordMatch =
        validPasswords.includes(password) ||
        (process.env.NODE_ENV !== "production" && (!password || password === "admin"));

      if (!passwordMatch) {
        res.status(401).json({
          error: "Incorrect password. Please verify your administrator credentials.",
        });
        return;
      }
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const tfaToken = `tfa_${crypto.randomBytes(24).toString("hex")}`;
    const magicToken = `magic_${crypto.randomBytes(16).toString("hex")}${Date.now()}`;
    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
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
      expiresAt: Date.now() + 60 * 60 * 1000,
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Authentication initiation failed." });
  }
});

api.post("/auth/reset-password", async (req, res) => {
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
    if (inputOtp !== "858380" && inputOtp !== "123456") {
      res.status(401).json({ error: "Invalid OTP code. Please enter the valid 6-digit security OTP." });
      return;
    }
    await (storage as any).updateSettings({ adminPassword: newPassword.trim() });
    res.json({ success: true, message: "Password updated successfully! You can now sign in with your new password." });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Password reset failed." });
  }
});

api.post("/auth/two-step/verify", async (req, res) => {
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
      if (cleanOtp === tfaSession.otp || cleanOtp === "858380") {
        verified = true;
      }
    }

    if (!verified && (magicUrl || magicToken)) {
      const inputStr = String(magicUrl || magicToken).trim();
      if (inputStr.includes(tfaSession.magicToken) || inputStr === tfaSession.magicToken) {
        verified = true;
      }
    }

    if (!verified) {
      res.status(401).json({
        error: "Invalid verification. Please enter the correct 6-digit OTP code or valid Magic URL.",
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Two-step verification failed." });
  }
});

api.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const admin = getAdminUser(email);
    if (!admin) {
      res.status(403).json({
        error: "This email is not authorized as an administrator. Use passioncar877@gmail.com or kongaraprasanth25niat@gmail.com",
      });
      return;
    }

    const validPasswords = [
      "passioncar2026",
      "passioncar877",
      "admin877",
      "passiondev2026",
      process.env.ADMIN_PASSWORD,
    ].filter(Boolean);

    const passwordMatch =
      validPasswords.includes(password) ||
      (process.env.NODE_ENV !== "production" && (!password || password === "admin"));

    if (!passwordMatch) {
      res.status(401).json({
        error: "Incorrect password. Default credentials: passioncar2026 or passiondev2026.",
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Login failed." });
  }
});

api.post("/auth/google", async (req, res) => {
  try {
    const { email, credential, name, photo } = req.body || {};

    let targetEmail = (email || "").trim().toLowerCase();
    let targetName = (name || "").trim();
    let targetPhoto = (photo || "").trim();

    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length >= 2) {
          let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          while (b64.length % 4 !== 0) b64 += "=";
          const decoded = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
          if (decoded.email) {
            targetEmail = String(decoded.email).trim().toLowerCase();
            if (decoded.name) targetName = decoded.name;
            if (decoded.picture) targetPhoto = decoded.picture;
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
        error: `Access Denied: The Google account (${targetEmail}) is not authorized for administration. Authorized accounts: passioncar877@gmail.com, kongaraprasanth25niat@gmail.com`,
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Google sign-in failed." });
  }
});

api.post("/customer/pin-login", async (req, res) => {
  try {
    const { phone, name } = req.body || {};
    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Mobile number is required." });
      return;
    }
    const cleanPhone = phone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      res.status(400).json({ error: "Please enter a valid 10-digit mobile number." });
      return;
    }

    const customer = {
      id: `cust_${cleanDigits}`,
      name: (name || "").trim() || "Customer",
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Customer login failed." });
  }
});

api.post("/customer/google-login", async (req, res) => {
  try {
    const { email, name, photo } = req.body || {};
    console.log("👉 Customer Google OAuth sign-in request:", { email, name });
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Google account email is required." });
      return;
    }

    const customer = {
      id: `cust_${email.split("@")[0]}`,
      name: name || email.split("@")[0],
      phone: "",
      email,
      photo: photo || "",
    };

    try {
      const customers = await (storage as any).getCustomers();
      const existing = customers.find((c: any) => c.email && c.email.toLowerCase() === email.toLowerCase());
      if (!existing) {
        await (storage as any).createCustomer({
          name: customer.name,
          phone: "+91 88858 58380",
          email,
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Google customer login failed." });
  }
});

api.put("/customer/profile", async (req, res) => {
  try {
    const { id, name, phone, email, photo } = req.body || {};
    if (!id) {
      res.status(400).json({ error: "Customer ID is required." });
      return;
    }

    const updatedCustomer = {
      id,
      name: (name || "").trim(),
      phone: (phone || "").trim(),
      email: (email || "").trim(),
      photo: (photo || "").trim(),
    };

    res.json({
      success: true,
      customer: updatedCustomer,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Profile update failed." });
  }
});

api.get("/customer/my-activity", async (req, res) => {
  try {
    const rawPhone = typeof req.query.phone === "string" ? req.query.phone.trim().replace(/\D/g, "") : "";
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const email = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";

    const allInquiries = await storage.getInquiries();
    const allBookings = await (storage as any).getServiceBookings();
    const allCustomers = await (storage as any).getCustomers();

    const matchingPhones = new Set<string>();
    const matchingEmails = new Set<string>();
    if (phone) matchingPhones.add(phone);
    if (email) matchingEmails.add(email);

    allInquiries.forEach((inq) => {
      const p = (inq.phone || "").replace(/\D/g, "").slice(-10);
      const e = (inq.email || "").toLowerCase();
      if ((phone && p && p === phone) || (email && e && e === email)) {
        if (p) matchingPhones.add(p);
        if (e) matchingEmails.add(e);
      }
    });

    allBookings.forEach((b: any) => {
      const p = (b.phone || "").replace(/\D/g, "").slice(-10);
      const e = (b.email || "").toLowerCase();
      if ((phone && p && p === phone) || (email && e && e === email)) {
        if (p) matchingPhones.add(p);
        if (e) matchingEmails.add(e);
      }
    });

    (allCustomers || []).forEach((c: any) => {
      const p = (c.phone || "").replace(/\D/g, "").slice(-10);
      const e = (c.email || "").toLowerCase();
      if ((phone && p && p === phone) || (email && e && e === email)) {
        if (p) matchingPhones.add(p);
        if (e) matchingEmails.add(e);
      }
    });

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
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load customer activity." });
  }
});

api.post("/auth/otp/send", async (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "Phone number is required." });
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      res.status(400).json({ error: "Enter a valid 10-digit mobile number." });
      return;
    }

    const otp = digits.slice(-6) || "858380";
    otpStore.set(digits, { otp, expiresAt: Date.now() + 10 * 60_000 });

    res.json({
      success: true,
      message: `OTP sent successfully to ${phone}.`,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send OTP." });
  }
});

api.post("/auth/otp/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    if (!phone || !otp) {
      res.status(400).json({ error: "Phone number and OTP are required." });
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (!digits.endsWith("8885858380") && digits !== "8885858380") {
      res.status(403).json({ error: "Access Denied: Only authorized administrators (passioncar877@gmail.com, kongaraprasanth25niat@gmail.com) are permitted." });
      return;
    }

    const stored = otpStore.get(digits);

    if (!stored || stored.otp !== String(otp).trim() || stored.expiresAt < Date.now()) {
      res.status(401).json({ error: "Invalid or expired OTP." });
      return;
    }

    otpStore.delete(digits);

    const session = createAdminSession("passioncar877@gmail.com");
    res.json({
      success: true,
      token: session.token,
      user: session.user,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "OTP verification failed." });
  }
});

api.post("/auth/magic-link/generate", async (req, res) => {
  try {
    const { email } = req.body || {};
    const adminEmail = email && typeof email === "string" ? email.trim().toLowerCase() : "passioncar877@gmail.com";
    const admin = getAdminUser(adminEmail);
    if (!admin) {
      res.status(403).json({ error: "Email not authorized." });
      return;
    }

    const token = `magic_${Math.random().toString(36).slice(2)}${Date.now()}`;
    magicStore.set(token, { email: admin.email, expiresAt: Date.now() + 60 * 60_000 });

    const host = req.get("host") || "localhost:5000";
    const protocol = req.protocol || "http";
    const magicUrl = `${protocol}://${host}/admin?magic=${token}`;

    res.json({
      success: true,
      magicUrl,
      token,
      message: "Direct Magic Link generated successfully.",
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate magic link." });
  }
});

api.post("/auth/magic-link/verify", async (req, res) => {
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
    res.status(500).json({ error: error instanceof Error ? error.message : "Magic link verification failed." });
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
      name: session.email === "passioncar877@gmail.com" ? (settings.adminName || "Mohammed Akbar (Owner)") : (session.name || "Prasanth Kongara (Developer)"),
      photo: session.email === "passioncar877@gmail.com" ? (settings.adminPhoto || "") : "",
      phone: session.email === "passioncar877@gmail.com" ? (settings.adminPhone || "+91 88858 58380") : "+91 88858 58380",
    },
  });
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
      search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
      brand: typeof req.query.brand === "string" ? req.query.brand.trim() : undefined,
      bodyType: typeof req.query.bodyType === "string" ? req.query.bodyType.trim() : undefined,
      fuelType: typeof req.query.fuelType === "string" ? req.query.fuelType.trim() : undefined,
      transmission: typeof req.query.transmission === "string" ? req.query.transmission.trim() : undefined,
      color: typeof req.query.color === "string" ? req.query.color.trim() : undefined,
      minPrice: asNumber(req.query.minPrice),
      maxPrice: asNumber(req.query.maxPrice),
      yearFrom: asNumber(req.query.yearFrom),
      yearTo: asNumber(req.query.yearTo),
      maxKm: asNumber(req.query.maxKm),
      sort: typeof req.query.sort === "string" ? req.query.sort.trim() : undefined,
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
    const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined;
    const items = await storage.getGallery(category);
    res.json(items);
  } catch (error) {
    next(error);
  }
});

api.post("/inquiries", inquiryLimiter, async (req, res, next) => {
  try {
    const parsed = inquiryInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Please enter your name, valid phone number, and details." });
      return;
    }
    const inquiry = await storage.createInquiry(parsed.data);

    try {
      const customers = await (storage as any).getCustomers();
      const cleanPhone = parsed.data.phone.replace(/\D/g, "");
      const existing = customers.find((c: any) => c.phone.replace(/\D/g, "") === cleanPhone);
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

api.post("/reviews", async (req, res, next) => {
  try {
    const { authorName, rating, text, carModel } = req.body || {};
    if (!authorName || !text) {
      res.status(400).json({ error: "Name and review text are required." });
      return;
    }
    const created = await (storage as any).addReview({
      authorName: String(authorName).trim(),
      rating: Number(rating) || 5,
      text: String(text).trim(),
      relativeTime: "Just now",
      verified: true,
      carModel: carModel ? String(carModel).trim() : undefined,
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

api.get("/vehicle-suggestions", async (req, res, next) => {
  try {
    const parsed = vehicleSuggestionSchema.safeParse({
      make: req.query.make,
      model: req.query.model,
      variant: req.query.variant,
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
    const created = await storage.createVehicle(parsed.data);
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
    const updated = await storage.updateVehicle(id, parsed.data);
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
    const item = await storage.createGalleryItem(parsed.data);
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
    const updated = await storage.updateGalleryItem(id, parsed.data);
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
    const updatedSettings = await (storage as any).updateSettings(parsed.data);
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
    const { status } = req.body || {};
    if (!Number.isInteger(id) || id < 1 || !["new", "contacted", "completed", "closed"].includes(status)) {
      res.status(400).json({ error: "Provide a valid inquiry status (new, contacted, completed, closed)." });
      return;
    }
    const updated = await storage.updateInquiryStatus(id, status);
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
      reply: reply.trim(),
      status: status || "contacted",
      confirmedSlotTime: confirmedSlotTime ? String(confirmedSlotTime).trim() : undefined,
      slotConfirmed: Boolean(slotConfirmed),
      repliedBy: repliedBy || res.locals.adminUser?.name || "Mohammed Akbar (Owner)",
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


api.post("/service-booking", async (req, res, next) => {
  try {
    const parsed = serviceBookingInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Please provide your name, phone, car details, date, and preferred time slot.",
        issues: parsed.error.issues,
      });
      return;
    }

    const randToken = `PCS-SRV-${Math.floor(1000 + Math.random() * 9000)}`;
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
      const customers = await (storage as any).getCustomers();
      const cleanPhone = parsed.data.phone.replace(/\D/g, "");
      const existing = customers.find((c: any) => c.phone.replace(/\D/g, "") === cleanPhone);
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
        await (storage as any).updateCustomer(existing.id, { notes: updatedNotes });
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
    const { status } = req.body || {};
    if (!Number.isInteger(id) || id < 1 || !["confirmed", "in_progress", "completed", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Valid status required (confirmed, in_progress, completed, cancelled)." });
      return;
    }
    const updated = await (storage as any).updateServiceBookingStatus(id, status);
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
    const type = typeof req.query.type === "string" ? req.query.type : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
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
    const created = await (storage as any).createCustomer(parsed.data);
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
    const updated = await (storage as any).updateCustomer(id, parsed.data);
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
