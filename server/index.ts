import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { clerkConfigured } from "./auth";
import { pool } from "./db";
import { isDynamoConfigured, TABLE_NAME, AWS_REGION } from "./dynamodb";
import { api } from "./routes";

const app = express();
const dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.APP_URL,
  "https://www.passioncar.in",
  "https://passioncar.in",
  "http://www.passioncar.in",
  "http://passioncar.in",
  "https://passion-car.onrender.com",
  "http://localhost:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5000",
  "http://127.0.0.1:5173",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      const cleanOrigin = origin ? origin.replace(/\/+$/, "") : "";
      if (
        !cleanOrigin ||
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".passioncar.in") ||
        cleanOrigin === "https://passioncar.in" ||
        cleanOrigin === "http://passioncar.in" ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS request blocked by security policy."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
  }),
);

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https://www.passioncar.in https://passioncar.in; script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://www.passioncar.in https://passioncar.in; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob: https://www.passioncar.in https://passioncar.in; connect-src 'self' https://www.passioncar.in https://passioncar.in https://passion-car.onrender.com https://accounts.google.com https://apis.google.com; frame-src 'self' https://accounts.google.com https://www.google.com https://www.passioncar.in https://passioncar.in;",
  );
  next();
});

const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

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
  console.log("Using direct admin credential authentication (passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, hirlume.info@gmail.com).");
}

app.use(express.static(path.resolve(dirname, "../public")));

app.use("/api", globalApiLimiter, api);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err instanceof Error ? err.message : "unknown");
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  if (isDynamoConfigured) {
    console.log(`Connected to Amazon DynamoDB NoSQL (Table: ${TABLE_NAME}, Region: ${AWS_REGION})`);
  } else {
    console.log("Amazon DynamoDB NoSQL mode active (DocumentStore JSON structure, 25 GB Free Tier compatible).");
  }

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(dirname, "../dist/public");
    app.use(express.static(distDir, { maxAge: "1h", index: false }));
    app.use((_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distDir, "index.html"));
    });
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
    console.log(`Passion Car Platform running on http://localhost:${port}`);
    console.log(`Admin Login: http://localhost:${port}/admin`);
    console.log("Authorized Admins: passioncar877@gmail.com, kongaraprasanth25niat@gmail.com, hirlume.info@gmail.com");
  });
}

start().catch(async (error) => {
  console.error("Server startup failed:", error instanceof Error ? error.message : "unknown error");
  if (pool) await pool.end();
  process.exit(1);
});
