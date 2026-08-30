import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import { env } from "./backend/config/env";
import { logger } from "./backend/logger";
import { helmetMiddleware, corsMiddleware, apiRateLimiter } from "./backend/middleware/security";
import { requestLogger } from "./backend/middleware/requestLogger";
import { errorHandler } from "./backend/middleware/errorHandler";
import apiRoutes from "./backend/routes";
import { schedulerService } from "./backend/services/SchedulerService";
import { nexusWebSocketServer } from "./backend/websocket/WebSocketServer";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = env.PORT || 3000;

  // Security & Core Middleware
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  // Boot Scheduler Service (real, Prisma-backed - see backend/services/SchedulerService.ts)
  schedulerService.startLoop(30000);

  // Rate Limiting on API endpoints
  app.use("/api/", apiRateLimiter);

  // Mount Modular Production Routes (/api/v1, /api/health)
  app.use(apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  // ==========================================
  // VITE MIDDLEWARE / STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.system.info(`[NexusFlow] Server active on http://0.0.0.0:${PORT}`);
  });

  // Attach WebSocket Server
  nexusWebSocketServer.init(server, '/ws');

  // Graceful Shutdown
  const gracefulShutdown = (signal: string) => {
    logger.system.info(`Received ${signal}. Initiating graceful shutdown...`);
    schedulerService.stopLoop();
    nexusWebSocketServer.close();
    server.close(() => {
      logger.system.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();
