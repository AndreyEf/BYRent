import type { Express } from "express";
import type { Server, IncomingMessage, ClientRequest } from "http";
import { ServerResponse } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Socket } from "net";

const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || "http://localhost:5001";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  app.use("/api", (req, res, next) => {
    req.url = "/api" + req.url;
    apiProxy(req, res, next);
  });

  return httpServer;
}
