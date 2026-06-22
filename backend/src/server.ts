import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import poolRoutes from "./routes/poolRoutes.js";

// DB Seeding checklist
import { readDatabase } from "./utils/dbLocal.js";
import { testConnection } from "./config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Setup local data seeding
  console.log("🎒 Checking database connection and initializing schemas...");
  readDatabase(); // Seeding local database if not present
  await testConnection(); // Output postgres connection diagnostics if host set

  // Enable CORS
  app.use(cors());
  app.use(express.json());

  // Mount central Express api routes
  app.use("/api/auth", authRoutes);
  app.use("/api/channels", channelRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/workflows", workflowRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/pool", poolRoutes);

  // System Diagnostics API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      uptime: process.uptime(),
      timestamp: Date.now(),
      engine: "ThreadForge Express monorepo service"
    });
  });

  // Integration of single port developer environment vs server hosting
  if (process.env.NODE_ENV !== "production") {
    console.log("⚡ Starting Development Hot Vite mounting loop...");
    
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "../../frontend")
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    console.log("📦 Production assets delivery active (Static files pipeline)...");
    const distPath = path.resolve(__dirname, "../../frontend/dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Fallback to index.html for SPA router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 ThreadForge Monorepo application available on: http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("☠️ Critical Error spawning fullstack ThreadForge coordinator: ", err);
  process.exit(1);
});
