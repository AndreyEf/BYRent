import type { Express } from "express";
import type { Server, IncomingMessage, ClientRequest } from "http";
import { ServerResponse } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Socket } from "net";
import express from "express";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage/routes";

const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || "http://localhost:5001";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register object storage routes BEFORE the proxy (they need body parsing)
  app.use("/api/uploads", express.json());
  app.use("/objects", express.json());
  registerObjectStorageRoutes(app);

  const apiProxy = createProxyMiddleware({
    target: JAVA_BACKEND_URL,
    changeOrigin: true,
    on: {
      error: (err: Error, req: IncomingMessage, res: ServerResponse | Socket) => {
        console.error("Proxy error:", err.message);
        if (res instanceof ServerResponse && !res.headersSent) {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ 
            message: "Backend service unavailable. Please ensure Java backend is running." 
          }));
        }
      },
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
        if (req.headers.cookie) {
          proxyReq.setHeader("Cookie", req.headers.cookie);
        }
      },
      proxyRes: (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse) => {
        const cookies = proxyRes.headers["set-cookie"];
        if (cookies) {
          res.setHeader("Set-Cookie", cookies);
        }
      },
    },
  });

  // Proxy remaining /api requests to Java backend
  app.use("/api", (req, res, next) => {
    // Skip if already handled by object storage routes
    if (req.path.startsWith("/uploads")) {
      return next("route");
    }
    req.url = "/api" + req.url;
    apiProxy(req, res, next);
  });

  return httpServer;
}
