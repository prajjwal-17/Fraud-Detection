import { Transaction } from "../models/Transaction.js";
import { logOpsEvent } from "./opsEvent.service.js";

const loginAttemptStore = new Map();

export const recordLoginAttempt = async ({ email, ip, success }) => {
  const key = `${email}:${ip}`;
  const now = Date.now();
  const attempts = (loginAttemptStore.get(key) || []).filter(
    (timestamp) => now - timestamp < 10 * 60 * 1000
  );

  if (!success) {
    attempts.push(now);
    loginAttemptStore.set(key, attempts);
  } else {
    loginAttemptStore.delete(key);
  }

  if (attempts.length >= 5) {
    await logOpsEvent({
      type: "SUSPICIOUS_LOGIN",
      severity: "WARN",
      message: "Rapid login attempts detected",
      metadata: {
        email,
        ip,
        attempts: attempts.length
      }
    });
  }
};

export const enforceTransactionRateLimit = async ({ senderId }) => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const count = await Transaction.countDocuments({
    sender: senderId,
    createdAt: { $gte: oneMinuteAgo }
  });

  if (count >= 10) {
    await logOpsEvent({
      type: "TRANSACTION_RATE_LIMIT",
      severity: "WARN",
      message: "Transaction rate limit exceeded",
      userId: senderId,
      metadata: {
        count,
        window: "1m"
      }
    });

    const error = new Error("Transaction rate limit exceeded for this user");
    error.statusCode = 429;
    throw error;
  }
};
