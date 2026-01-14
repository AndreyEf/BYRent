import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startJavaBackend } from "./start-java";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  log("Starting proxy server for Java backend...", "proxy");
  
  // Start Java backend in parallel
  startJavaBackend().catch((err) => {
    log(`Warning: Java backend failed to start: ${err.message}`, "java");
  });
  
  // Register API proxy first (before body parsing)
  await registerRoutes(httpServer, app);

  // Body parsing only for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    express.urlencoded({ extended: false })(req, res, next);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
