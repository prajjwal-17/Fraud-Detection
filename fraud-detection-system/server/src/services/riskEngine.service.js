import { performance } from "node:perf_hooks";
import { Transaction } from "../models/Transaction.js";
import { RiskLog } from "../models/RiskLog.js";
import { User } from "../models/User.js";
import {
  buildBehaviorFeatures,
  upsertDeviceSession
} from "./behavior.service.js";
import { predictFraud } from "./mlClient.service.js";
import { cacheRecentTransaction } from "../config/redis.js";
import { deriveAlerts } from "./alert.service.js";
import { broadcastRiskEvent } from "./socket.service.js";
import { logger } from "../config/logger.js";

const ruleWeightMap = {
  HIGH_VALUE_ANOMALY: 18,
  RAPID_TRANSFERS: 16,
  DEVICE_MISMATCH: 14,
  LOCATION_DRIFT: 12
};

const classifyDecision = (score) => {
  if (score > 70) return "FRAUD";
  if (score >= 30) return "SUSPICIOUS";
  return "SAFE";
};

const statusFromDecision = (decision) => {
  if (decision === "FRAUD") return "blocked";
  if (decision === "SUSPICIOUS") return "held";
  return "processed";
};

export const processTransaction = async ({
  senderId,
  receiverId,
  amount,
  deviceId,
  location,
  mode = "manual"
}) => {
  const [sender, receiver] = await Promise.all([
    User.findById(senderId),
    User.findById(receiverId)
  ]);

  if (!sender || !receiver) {
    throw new Error("Sender or receiver not found");
  }

  const behaviorFeatures = await buildBehaviorFeatures({
    sender,
    amount,
    deviceId,
    location
  });

  const ruleSignals = [];
  if (amount > 50000 && behaviorFeatures.amount_delta_ratio > 2.5) {
    ruleSignals.push("HIGH_VALUE_ANOMALY");
  }
  if (behaviorFeatures.velocity_1h >= 5) {
    ruleSignals.push("RAPID_TRANSFERS");
  }
  if (behaviorFeatures.device_mismatch) {
    ruleSignals.push("DEVICE_MISMATCH");
  }
  if (behaviorFeatures.location_deviation_km > 250) {
    ruleSignals.push("LOCATION_DRIFT");
  }

  const startedAt = performance.now();
  let mlResponse = {
    fraud_probability: 0.2,
    anomaly_score: 0.1,
    top_factors: []
  };

  try {
    mlResponse = await predictFraud({
      transaction: {
        amount,
        timestamp: new Date().toISOString(),
        device_id: deviceId,
        location_city: location.city
      },
      behavior_features: behaviorFeatures
    });
  } catch (error) {
    logger.warn({
      message: "ML prediction failed, using rule-only fallback",
      error: error.message
    });
  }

  const rulesContribution = ruleSignals.reduce(
    (sum, signal) => sum + (ruleWeightMap[signal] || 8),
    0
  );

  const finalRiskScore = Math.min(
    100,
    Math.round(mlResponse.fraud_probability * 65 + rulesContribution)
  );
  const decision = classifyDecision(finalRiskScore);
  const status = statusFromDecision(decision);
  const latencyMs = Math.round(performance.now() - startedAt);

  const transaction = await Transaction.create({
    sender: sender._id,
    receiver: receiver._id,
    amount,
    deviceId,
    mode,
    location,
    mlScore: mlResponse.fraud_probability,
    finalRiskScore,
    decision,
    rulesTriggered: ruleSignals,
    status
  });

  await RiskLog.create({
    transactionId: transaction._id,
    senderId: sender._id,
    mlScore: mlResponse.fraud_probability,
    anomalyScore: mlResponse.anomaly_score,
    ruleSignals,
    finalRiskScore,
    decision,
    topFactors: mlResponse.top_factors,
    latencyMs,
    audit: {
      behaviorFeatures,
      mode
    }
  });

  const isTrusted = !behaviorFeatures.device_mismatch;
  const nextAverageAmount =
    Math.round(((sender.profile?.averageAmount || amount) + amount) / 2);

  await Promise.all([
    upsertDeviceSession({
      userId: sender._id,
      deviceId,
      location,
      isTrusted
    }),
    cacheRecentTransaction(sender._id.toString(), {
      amount,
      createdAt: new Date().toISOString(),
      decision
    }),
    User.findByIdAndUpdate(sender._id, {
      $set: {
        "profile.averageAmount": nextAverageAmount,
        "profile.riskLevel": finalRiskScore
      }
    })
  ]);

  const senderTrustedDevices = sender.trustedDevices || [];
  if (isTrusted && !senderTrustedDevices.includes(deviceId)) {
    sender.trustedDevices = [...senderTrustedDevices, deviceId];
    await sender.save();
  }

  const alerts = deriveAlerts({
    amount,
    behaviorFeatures,
    rulesTriggered: ruleSignals,
    decision
  });

  const payload = {
    transactionId: transaction._id,
    sender: { id: sender._id, name: sender.name },
    receiver: { id: receiver._id, name: receiver.name },
    amount,
    decision,
    status,
    finalRiskScore,
    mlScore: mlResponse.fraud_probability,
    rulesTriggered: ruleSignals,
    topFactors: mlResponse.top_factors,
    behaviorFeatures,
    alerts,
    createdAt: transaction.createdAt,
    location
  };

  broadcastRiskEvent("transaction:created", payload);
  if (alerts.length > 0) {
    broadcastRiskEvent("alert:created", {
      transactionId: transaction._id,
      alerts,
      decision,
      finalRiskScore,
      createdAt: transaction.createdAt
    });
  }

  return payload;
};
