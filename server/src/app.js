import express from "express";
import http from "node:http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { env } from "./config/env.js";
import { getRedisStatus } from "./config/redis.js";
import { initializeSocket } from "./services/socket.service.js";

export const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true
    }
  });

  initializeSocket(io);

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/", (_req, res) => {
    res.json({
      service: "fraud-detection-server",
      status: "running",
      health: "/health"
    });
  });

  app.get("/health", (_req, res) => {
    const mongoConnected = mongoose.connection.readyState === 1;
    const redis = getRedisStatus();

    res.status(mongoConnected ? 200 : 503).json({
      status: mongoConnected ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      services: {
        mongo: mongoConnected ? "up" : "down",
        redis: redis.available ? "up" : "degraded"
      }
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/transactions", transactionRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error"
    });
  });

  return { app, server, io };
};
