import dotenv from "dotenv";

dotenv.config();

const clientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 5000),
  clientUrl: clientUrls[0],
  clientUrls,
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/fraud_detection_system",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8001",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  logLevel: process.env.LOG_LEVEL || "info"
};
