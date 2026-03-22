import { DeviceSession } from "../models/DeviceSession.js";
import { RiskLog } from "../models/RiskLog.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { getRedisStatus } from "../config/redis.js";

export const getOverview = async (req, res, next) => {
  try {
    const [recentTransactions, recentRiskLogs, users, sessions] = await Promise.all([
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(12)
        .populate("sender receiver", "name"),
      RiskLog.find().sort({ createdAt: -1 }).limit(50),
      User.find({ role: "user" }).select("name email profile"),
      DeviceSession.find().sort({ updatedAt: -1 }).limit(20)
    ]);

    const flaggedCount = recentRiskLogs.filter((log) =>
      ["SUSPICIOUS", "FRAUD"].includes(log.decision)
    ).length;

    const fraudTrend = recentRiskLogs.slice(0, 7).reverse().map((log) => ({
      time: log.createdAt,
      score: log.finalRiskScore,
      mlScore: Number((log.mlScore * 100).toFixed(1))
    }));

    res.json({
      metrics: {
        processedTransactions: recentTransactions.length,
        flaggedTransactions: flaggedCount,
        averageRiskScore:
          recentRiskLogs.length > 0
            ? Math.round(
                recentRiskLogs.reduce((sum, log) => sum + log.finalRiskScore, 0) /
                  recentRiskLogs.length
              )
            : 0,
        redisAvailable: getRedisStatus().available
      },
      liveFeed: recentTransactions.map((tx) => ({
        id: tx._id,
        sender: tx.sender?.name,
        receiver: tx.receiver?.name,
        amount: tx.amount,
        decision: tx.decision,
        riskScore: tx.finalRiskScore,
        status: tx.status,
        createdAt: tx.createdAt,
        location: tx.location?.city
      })),
      fraudTrend,
      alerts: recentRiskLogs
        .filter((log) => log.ruleSignals.length > 0 || log.decision === "FRAUD")
        .slice(0, 8)
        .map((log) => ({
          id: log._id,
          decision: log.decision,
          finalRiskScore: log.finalRiskScore,
          ruleSignals: log.ruleSignals,
          createdAt: log.createdAt
        })),
      userProfiles: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        riskLevel: user.profile?.riskLevel || 0,
        averageAmount: user.profile?.averageAmount || 0
      })),
      deviceSessions: sessions
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const alerts = await RiskLog.find({
      $or: [{ decision: "FRAUD" }, { ruleSignals: { $exists: true, $ne: [] } }]
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ alerts });
  } catch (error) {
    next(error);
  }
};
