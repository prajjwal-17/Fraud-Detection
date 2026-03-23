import axios from "axios";
import { env } from "../config/env.js";
import { getRedisStatus } from "../config/redis.js";

export const getMlServiceStatus = async () => {
  try {
    const startedAt = Date.now();
    await axios.get(`${env.mlServiceUrl}/health`, { timeout: 1000 });
    return {
      status: "UP",
      latencyMs: Date.now() - startedAt
    };
  } catch (_error) {
    return {
      status: "DOWN",
      latencyMs: null
    };
  }
};

export const getPlatformStatus = async (latestLatencyMs = 0) => {
  const ml = await getMlServiceStatus();
  const redis = getRedisStatus();

  return {
    mlService: ml,
    redis: {
      status: redis.available ? "UP" : "DEGRADED"
    },
    pipeline: {
      latencyMs: latestLatencyMs
    }
  };
};

