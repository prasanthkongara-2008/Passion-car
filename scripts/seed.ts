import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, pool } from "../server/db";
import { customers, inquiries, serviceBookings, showroomGallery, siteSettings, vehicles } from "../shared/schema";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.resolve(__dirname, "../data/store.json");

async function seed() {
  if (!db || !pool) {
    console.log("Database not configured via DATABASE_URL; skipping PostgreSQL seed.");
    return;
  }

  if (!fs.existsSync(storePath)) {
    console.log("No data/store.json found to migrate.");
    return;
  }

  const raw = fs.readFileSync(storePath, "utf-8");
  const store = JSON.parse(raw);

  if (Array.isArray(store.vehicles) && store.vehicles.length > 0) {
    for (const v of store.vehicles) {
      const { id, createdAt, updatedAt, ...rest } = v;
      const existing = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, id)).limit(1);
      if (!existing.length) {
        await db.insert(vehicles).values({
          ...rest,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        });
      }
    }
    console.log(`Migrated ${store.vehicles.length} vehicles to Supabase.`);
  }

  if (Array.isArray(store.gallery) && store.gallery.length > 0) {
    for (const g of store.gallery) {
      const { id, createdAt, ...rest } = g;
      const existing = await db.select({ id: showroomGallery.id }).from(showroomGallery).where(eq(showroomGallery.id, id)).limit(1);
      if (!existing.length) {
        await db.insert(showroomGallery).values({
          ...rest,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        });
      }
    }
    console.log(`Migrated ${store.gallery.length} gallery items to Supabase.`);
  }

  if (Array.isArray(store.inquiries) && store.inquiries.length > 0) {
    for (const inq of store.inquiries) {
      const { id, createdAt, ...rest } = inq;
      const existing = await db.select({ id: inquiries.id }).from(inquiries).where(eq(inquiries.id, id)).limit(1);
      if (!existing.length) {
        await db.insert(inquiries).values({
          ...rest,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        });
      }
    }
    console.log(`Migrated ${store.inquiries.length} inquiries to Supabase.`);
  }

  if (Array.isArray(store.customers) && store.customers.length > 0) {
    for (const c of store.customers) {
      const { id, createdAt, ...rest } = c;
      const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).limit(1);
      if (!existing.length) {
        await db.insert(customers).values({
          ...rest,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        });
      }
    }
    console.log(`Migrated ${store.customers.length} customer records to Supabase.`);
  }

  if (Array.isArray(store.serviceBookings) && store.serviceBookings.length > 0) {
    for (const b of store.serviceBookings) {
      const { id, createdAt, ...rest } = b;
      const existing = await db.select({ id: serviceBookings.id }).from(serviceBookings).where(eq(serviceBookings.id, id)).limit(1);
      if (!existing.length) {
        await db.insert(serviceBookings).values({
          ...rest,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        });
      }
    }
    console.log(`Migrated ${store.serviceBookings.length} service bookings to Supabase.`);
  }

  if (store.settings) {
    for (const [key, value] of Object.entries(store.settings)) {
      await db
        .insert(siteSettings)
        .values({ key, value: { val: value } })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: { val: value }, updatedAt: new Date() },
        });
    }
    console.log("Migrated site settings to Supabase.");
  }

  console.log("Supabase database migration completed successfully!");
}

seed()
  .catch((err) => {
    console.error("Migration seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool?.end());
