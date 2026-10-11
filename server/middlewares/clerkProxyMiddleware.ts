import type { IncomingHttpHeaders } from "node:http";
import https from "node:https";
import type { RequestHandler } from "express";

const CLERK_FAPI_HOST = "frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

export function getClerkProxyHost(req: {
  headers: IncomingHttpHeaders;
}): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();
  return firstHop || req.headers.host?.trim() || undefined;
}

export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  return (req, res) => {
    const targetPath = req.url.replace(new RegExp(`^${CLERK_PROXY_PATH}`), "") || "/";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = getClerkProxyHost(req) || "";
    const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

    const headers: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: CLERK_FAPI_HOST,
      "clerk-proxy-url": proxyUrl,
      "clerk-secret-key": secretKey,
    };
    delete headers.connection;

    const proxyReq = https.request(
      {
        host: CLERK_FAPI_HOST,
        port: 443,
        path: targetPath,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        const resHeaders = { ...proxyRes.headers };
        delete resHeaders.connection;
        res.writeHead(proxyRes.statusCode || 200, resHeaders);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", () => {
      if (!res.headersSent) {
        res.status(502).json({ error: "Proxy connection failure" });
      }
    });

    req.pipe(proxyReq);
  };
}
