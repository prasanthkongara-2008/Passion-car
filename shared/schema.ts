import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  make: varchar("make", { length: 80 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  variant: varchar("variant", { length: 120 }).notNull().default(""),
  year: integer("year").notNull(),
  priceInr: integer("price_inr").notNull(),
  bodyType: varchar("body_type", { length: 40 }).notNull().default("Hatchback"),
  fuelType: varchar("fuel_type", { length: 24 }).notNull(),
  transmission: varchar("transmission", { length: 32 }).notNull().default("Manual"),
  kilometers: integer("kilometers").notNull().default(0),
  owners: integer("owners"),
  color: varchar("color", { length: 48 }).notNull().default(""),
  city: varchar("city", { length: 80 }).notNull().default("Hyderabad"),
  engineType: varchar("engine_type", { length: 120 }).notNull().default(""),
  engineCapacityCc: integer("engine_capacity_cc"),
  engineLengthMm: integer("engine_length_mm"),
  powerBhp: integer("power_bhp"),
  torqueNm: integer("torque_nm"),
  lengthMm: integer("length_mm"),
  widthMm: integer("width_mm"),
  heightMm: integer("height_mm"),
  wheelbaseMm: integer("wheelbase_mm"),
  groundClearanceMm: integer("ground_clearance_mm"),
  bootSpaceLitres: integer("boot_space_litres"),
  seatingCapacity: integer("seating_capacity"),
  fuelEfficiency: varchar("fuel_efficiency", { length: 40 }),
  batteryCapacityKwh: integer("battery_capacity_kwh"),
  rangeKm: integer("range_km"),
  description: text("description").notNull().default(""),
  features: text("features").array().notNull().default([]),
  imageUrls: text("image_urls").array().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 24 }).notNull().default("buy"),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  email: varchar("email", { length: 255 }),
  message: text("message").notNull().default(""),
  vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 80 }).notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const showroomGallery = pgTable("showroom_gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  category: varchar("category", { length: 60 }).notNull().default("Showroom"),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  email: varchar("email", { length: 255 }),
  carModel: varchar("car_model", { length: 120 }).notNull().default(""),
  regNumber: varchar("reg_number", { length: 32 }).default(""),
  transactionType: varchar("transaction_type", { length: 40 }).notNull().default("current_buyer"),
  amountInr: integer("amount_inr").default(0),
  date: varchar("date", { length: 30 }).notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("completed"),
  serviceToken: varchar("service_token", { length: 50 }),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const serviceBookings = pgTable("service_bookings", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 24 }).notNull(),
  email: varchar("email", { length: 255 }).default(""),
  carDetails: varchar("car_details", { length: 120 }).notNull(),
  servicePackage: varchar("service_package", { length: 120 }).notNull().default("Periodic Maintenance Service"),
  date: varchar("date", { length: 30 }).notNull(),
  timeSlot: varchar("time_slot", { length: 60 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("confirmed"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type GalleryItem = typeof showroomGallery.$inferSelect;
export type NewGalleryItem = typeof showroomGallery.$inferInsert;
export type CustomerDb = typeof customers.$inferSelect;
export type ServiceBookingDb = typeof serviceBookings.$inferSelect;

export const vehicleInputSchema = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  variant: z.string().trim().max(120).default(""),
  year: z.preprocess((val) => Number(val), z.number().int().min(1980).max(new Date().getFullYear() + 2)),
  priceInr: z.preprocess((val) => Number(val), z.number().int().min(1).max(100_000_000)),
  bodyType: z.string().trim().min(1).max(40).default("Hatchback"),
  fuelType: z.enum(["Petrol", "Diesel", "EV", "Hybrid", "CNG"]),
  transmission: z.string().trim().min(1).max(32).default("Manual"),
  kilometers: z.preprocess((val) => (val === "" || val === null || val === undefined ? 0 : Number(val)), z.number().int().nonnegative().default(0)),
  owners: z.preprocess((val) => (val === "" || val === null || val === undefined ? 1 : Number(val)), z.number().int().min(0).max(10).default(1)),
  color: z.string().trim().max(48).default(""),
  city: z.string().trim().min(1).max(80).default("Hyderabad"),
  engineType: z.string().trim().max(120).default(""),
  engineCapacityCc: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  engineLengthMm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  powerBhp: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  torqueNm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  lengthMm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  widthMm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  heightMm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  wheelbaseMm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  groundClearanceMm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  bootSpaceLitres: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  seatingCapacity: z.preprocess((val) => (val === "" || val === null || val === undefined ? 5 : Number(val)), z.number().int().min(1).max(12).nullable().optional()),
  fuelEfficiency: z.string().trim().max(40).nullable().optional(),
  batteryCapacityKwh: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  rangeKm: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().nonnegative().nullable().optional()),
  description: z.string().trim().max(4000).default(""),
  features: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  imageUrls: z.array(z.string().trim().min(1).max(1000)).max(15).default([]),
  status: z.enum(["available", "sold"]).default("available"),
});

export const inquiryInputSchema = z.object({
  type: z.enum(["buy", "sell", "contact", "exchange", "test_drive", "service"]),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().max(255).optional().or(z.literal("")).or(z.null()),
  message: z.string().trim().max(2000).default(""),
  vehicleId: z.number().int().positive().optional().nullable(),
});

export const settingsInputSchema = z.object({
  carsSold: z.number().int().min(0).max(1_000_000).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  whatsapp: z.string().trim().min(5).max(30).optional(),
  address: z.string().trim().max(300).optional(),
  adminPhoto: z.string().trim().max(5000000).optional(),
  adminName: z.string().trim().max(100).optional(),
  adminPhone: z.string().trim().max(30).optional(),
  showroomHoursMonSat: z.string().trim().max(120).optional(),
  showroomHoursSun: z.string().trim().max(120).optional(),
  googleRating: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().min(1).max(5).optional()),
  googleReviewsCount: z.preprocess((val) => (val === "" || val === null || val === undefined ? undefined : Number(val)), z.number().int().min(0).optional()),
});

export const customerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().max(255).optional().or(z.literal("")).or(z.null()),
  carModel: z.string().trim().min(2).max(120),
  regNumber: z.string().trim().max(32).optional(),
  transactionType: z.enum(["sold_to_dealership", "bought_from_dealership", "current_buyer"]),
  amountInr: z.number().int().min(0).optional(),
  date: z.string().trim().min(4).max(30).default(() => new Date().toISOString().split("T")[0]),
  status: z.enum(["completed", "in_progress", "pending_rc", "delivered"]).default("completed"),
  serviceToken: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const serviceBookingInputSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().max(255).optional().or(z.literal("")).or(z.null()),
  carDetails: z.string().trim().min(2).max(120),
  servicePackage: z.string().trim().min(2).max(120).default("Periodic Maintenance Service"),
  date: z.string().trim().min(4).max(30),
  timeSlot: z.string().trim().min(2).max(60),
  notes: z.string().trim().max(2000).optional(),
});

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  carModel: string;
  regNumber?: string;
  transactionType: "sold_to_dealership" | "bought_from_dealership" | "current_buyer";
  amountInr?: number;
  date: string;
  status: "completed" | "in_progress" | "pending_rc" | "delivered";
  serviceToken?: string;
  notes?: string;
  createdAt: string | Date;
};

export type ServiceBooking = {
  id: number;
  token: string;
  customerName: string;
  phone: string;
  email?: string | null;
  carDetails: string;
  servicePackage: string;
  date: string;
  timeSlot: string;
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "postponed";
  notes?: string;
  createdAt: string | Date;
};

export const galleryItemInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(60).default("Showroom"),
  imageUrl: z.string().trim().min(1),
  caption: z.string().trim().default(""),
  sortOrder: z.number().int().default(0),
});

export const vehicleSuggestionSchema = z.object({
  make: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  variant: z.string().trim().max(120).optional(),
  year: z.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  fuelType: z.enum(["Petrol", "Diesel", "EV", "Hybrid", "CNG"]),
});
