import { db, pool } from "../server/db";
import { inquiries, showroomGallery, vehicles, customers, serviceBookings, siteSettings } from "../shared/schema";
import { eq, or } from "drizzle-orm";
import fs from "node:fs";

async function verify() {
  if (!db || !pool) {
    console.error("Database not connected: pool or db is null");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const res = await client.query("SELECT current_database(), current_user, inet_server_addr(), now()");
    console.log("Connected to Supabase PostgreSQL successfully!");
    console.log("Database info:", res.rows[0]);

    const delInquiries = await db.delete(inquiries).where(
      or(eq(inquiries.status, "completed"), eq(inquiries.status, "closed"))
    ).returning();
    console.log(`Cleaned up ${delInquiries.length} completed/closed inquiries from Supabase.`);

    const allGallery = await db.select().from(showroomGallery);
    console.log(`Found ${allGallery.length} gallery items in Supabase.`);

    const item8 = allGallery.find((g) => g.imageUrl.includes("review-07.webp"));
    const item9 = allGallery.find((g) => g.imageUrl.includes("review-08.webp"));
    const heroItem = allGallery.find((g) => g.imageUrl.includes("hero-delivery.webp"));

    if (item8) {
      await db.update(showroomGallery).set({ sortOrder: 1 }).where(eq(showroomGallery.id, item8.id));
      console.log(`Set item8 (${item8.imageUrl}) sortOrder to 1 in Supabase.`);
    }
    if (item9) {
      await db.update(showroomGallery).set({ sortOrder: 2 }).where(eq(showroomGallery.id, item9.id));
      console.log(`Set item9 (${item9.imageUrl}) sortOrder to 2 in Supabase.`);
    }
    if (heroItem) {
      await db.update(showroomGallery).set({ sortOrder: 3 }).where(eq(showroomGallery.id, heroItem.id));
      console.log(`Set heroItem (${heroItem.imageUrl}) sortOrder to 3 in Supabase.`);
    }

    const [vCount, gCount, inqCount, cCount, sCount, setCount] = await Promise.all([
      db.select().from(vehicles),
      db.select().from(showroomGallery),
      db.select().from(inquiries),
      db.select().from(customers),
      db.select().from(serviceBookings),
      db.select().from(siteSettings),
    ]);

    console.log("==========================================");
    console.log("SUPABASE CLOUD DATABASE LIVE STATUS:");
    console.log(`- Vehicles: ${vCount.length} rows`);
    console.log(`- Showroom Gallery: ${gCount.length} rows`);
    console.log(`- Active Inquiries / Leads: ${inqCount.length} rows`);
    console.log(`- Customers: ${cCount.length} rows`);
    console.log(`- Service Bookings: ${sCount.length} rows`);
    console.log(`- Site Settings: ${setCount.length} rows`);
    console.log("==========================================");

    const storePath = "data/store.json";
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
      store.inquiries = store.inquiries.filter((i: any) => i.status !== "completed" && i.status !== "closed");
      
      const st8 = store.gallery.find((g: any) => g.imageUrl.includes("review-07.webp"));
      const st9 = store.gallery.find((g: any) => g.imageUrl.includes("review-08.webp"));
      const stHero = store.gallery.find((g: any) => g.imageUrl.includes("hero-delivery.webp"));
      if (st8) st8.sortOrder = 1;
      if (st9) st9.sortOrder = 2;
      if (stHero) stHero.sortOrder = 3;
      store.gallery.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

      fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
      console.log("Updated data/store.json to match Supabase gallery order and clean completed inquiries.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
