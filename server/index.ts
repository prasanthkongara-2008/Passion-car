import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clerkConfigured } from "./auth";
import { pool } from "./db";
import { isDynamoConfigured, TABLE_NAME, AWS_REGION } from "./dynamodb";
import { api } from "./routes";

const app = express();
const dirname = path.dirname(fileURLToPath(import.meta.url));
app.set("trust proxy", 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (clerkConfigured) {
  try {
    const { clerkMiddleware } = await import("@clerk/express");
    const { publishableKeyFromHost } = await import("@clerk/shared/keys");
    const {
      CLERK_PROXY_PATH,
      clerkProxyMiddleware,
      getClerkProxyHost,
    } = await import("./middlewares/clerkProxyMiddleware");

    app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
    app.use(
      clerkMiddleware((req) => ({
        publishableKey: publishableKeyFromHost(
          getClerkProxyHost(req) ?? "",
          process.env.CLERK_PUBLISHABLE_KEY,
        ),
      })),
    );
    console.log("Clerk managed authentication active.");
  } catch (err) {
    console.warn("Clerk initialization skipped:", err instanceof Error ? err.message : err);
  }
} else {
  console.log("Using direct admin credential authentication (passioncar877@gmail.com, kongaraprasanth25niat@gmail.com).");
}

app.use(express.static(path.resolve(dirname, "../public")));

app.use("/api", api);

async function start() {
  if (isDynamoConfigured) {
    console.log(`⚡ Connected to Amazon DynamoDB NoSQL (Table: ${TABLE_NAME}, Region: ${AWS_REGION})`);
  } else {
    console.log(`📦 Amazon DynamoDB NoSQL mode active (DocumentStore JSON structure, 25 GB Free Tier compatible).`);
  }

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(dirname, "../dist/public");
    app.use(express.static(distDir, { maxAge: "1h", index: false }));
    app.use((_req, res) => res.sendFile(path.join(distDir, "index.html")));
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      configFile: path.resolve(dirname, "../vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT ?? 5000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Passion Car Platform running on http://localhost:${port}`);
    console.log(`🔑 Admin Login: http://localhost:${port}/admin`);
    console.log(`📧 Authorized Admins: passioncar877@gmail.com, kongaraprasanth25niat@gmail.com`);
    console.log(`======================================================\n`);
  });
}

start().catch(async (error) => {
  console.error("Server startup failed:", error instanceof Error ? error.message : "unknown error");
  if (pool) await pool.end();
  process.exit(1);
});
