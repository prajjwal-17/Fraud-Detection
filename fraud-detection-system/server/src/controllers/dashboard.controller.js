import { Case } from "../models/Case.js";
import { DeviceSession } from "../models/DeviceSession.js";
import { OpsEvent } from "../models/OpsEvent.js";
import { RiskLog } from "../models/RiskLog.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { appendCaseNote } from "../services/case.service.js";
import { getRedisStatus } from "../config/redis.js";
import { getPlatformStatus } from "../services/status.service.js";

const priorityWeight = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
};

const mapTransactionRow = (tx) => ({
  id: tx._id,
  sender: tx.sender?.name || tx.sender,
  receiver: tx.receiver?.name || tx.receiver,
  senderId: tx.sender?._id || tx.sender,
  receiverId: tx.receiver?._id || tx.receiver,
  amount: tx.amount,
  decision: tx.decision,
  priority: tx.priority,
  riskScore: tx.finalRiskScore,
  status: tx.status,
  createdAt: tx.createdAt,
  location: tx.location?.city || tx.location
});

export const getOverview = async (req, res, next) => {
  try {
    const [recentTransactions, recentRiskLogs, users, sessions, cases, opsEvents] =
      await Promise.all([
        Transaction.find()
          .sort({ createdAt: -1 })
          .limit(20)
          .populate("sender receiver", "name"),
        RiskLog.find().sort({ createdAt: -1 }).limit(60),
        User.find({ role: "user" }).select("name email profile"),
        DeviceSession.find().sort({ updatedAt: -1 }).limit(20),
        Case.find().sort({ updatedAt: -1 }).limit(20),
        OpsEvent.find().sort({ createdAt: -1 }).limit(10)
      ]);

    const flaggedCount = recentRiskLogs.filter((log) =>
      ["SUSPICIOUS", "FRAUD"].includes(log.decision)
    ).length;

    const fraudTrend = recentRiskLogs.slice(0, 10).reverse().map((log) => ({
      time: log.createdAt,
      score: log.finalRiskScore,
      mlScore: Number((log.mlScore * 100).toFixed(1))
    }));

    const status = await getPlatformStatus(recentRiskLogs[0]?.latencyMs || 0);

    res.json({
      metrics: {
        processedTransactions: recentTransactions.length,
        flaggedTransactions: flaggedCount,
        openCases: cases.filter((item) => ["OPEN", "UNDER_REVIEW"].includes(item.status)).length,
        averageRiskScore:
          recentRiskLogs.length > 0
            ? Math.round(
                recentRiskLogs.reduce((sum, log) => sum + log.finalRiskScore, 0) /
                  recentRiskLogs.length
              )
            : 0,
        redisAvailable: getRedisStatus().available
      },
      liveFeed: recentTransactions.map(mapTransactionRow),
      fraudTrend,
      alerts: recentRiskLogs
        .filter((log) => log.ruleSignals.length > 0 || log.decision === "FRAUD")
        .sort(
          (a, b) =>
            priorityWeight[b.priority] - priorityWeight[a.priority] ||
            new Date(b.createdAt) - new Date(a.createdAt)
        )
        .slice(0, 12)
        .map((log) => ({
          id: log._id,
          decision: log.decision,
          priority: log.priority,
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
      admins: await User.find({ role: "admin" }).select("name email"),
      deviceSessions: sessions,
      status,
      recentOpsEvents: opsEvents
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
      .limit(100);

    res.json({
      alerts: alerts
        .sort(
          (a, b) =>
            priorityWeight[b.priority] - priorityWeight[a.priority] ||
            new Date(b.createdAt) - new Date(a.createdAt)
        )
        .map((alert) => ({
          id: alert._id,
          decision: alert.decision,
          priority: alert.priority,
          finalRiskScore: alert.finalRiskScore,
          ruleSignals: alert.ruleSignals,
          createdAt: alert.createdAt
        }))
    });
  } catch (error) {
    next(error);
  }
};

export const getCases = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const cases = await Case.find(query)
      .sort({ updatedAt: -1 })
      .populate("transactionId")
      .populate("userId", "name email")
      .populate("assignedTo", "name email");

    res.json({
      cases: cases.map((item) => ({
        id: item._id,
        status: item.status,
        priority: item.priority,
        assignedTo: item.assignedTo?.name || item.assignedToName,
        latestRiskScore: item.latestRiskScore,
        decision: item.decision,
        resolutionReason: item.resolutionReason,
        notes: item.notes,
        user: item.userId,
        transaction: item.transactionId,
        updatedAt: item.updatedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const updateCase = async (req, res, next) => {
  try {
    const { status, assignedTo, resolutionReason, note } = req.body;
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (status) caseItem.status = status;
    if (resolutionReason !== undefined) caseItem.resolutionReason = resolutionReason;

    if (assignedTo) {
      const admin = await User.findById(assignedTo);
      if (admin) {
        caseItem.assignedTo = admin._id;
        caseItem.assignedToName = admin.name;
      }
    }

    await caseItem.save();

    if (note) {
      await appendCaseNote({
        caseId: caseItem._id,
        author: req.user,
        message: note
      });
    }

    const refreshed = await Case.findById(caseItem._id)
      .populate("userId", "name email")
      .populate("transactionId")
      .populate("assignedTo", "name email");

    res.json({ case: refreshed });
  } catch (error) {
    next(error);
  }
};

export const getTransactionDetail = async (req, res, next) => {
  try {
    const [transaction, riskLog, relatedCase] = await Promise.all([
      Transaction.findById(req.params.id).populate("sender receiver", "name email"),
      RiskLog.findOne({ transactionId: req.params.id }).sort({ createdAt: -1 }),
      Case.findOne({ transactionId: req.params.id })
    ]);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({
      transaction,
      riskLog,
      case: relatedCase
    });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const [user, transactions, sessions, riskLogs] = await Promise.all([
      User.findById(userId).select("-passwordHash"),
      Transaction.find({ sender: userId })
        .sort({ createdAt: -1 })
        .limit(40)
        .populate("receiver", "name email"),
      DeviceSession.find({ userId }).sort({ updatedAt: -1 }).limit(20),
      RiskLog.find({ senderId: userId }).sort({ createdAt: -1 }).limit(30)
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      transactions: transactions.map((tx) => ({
        id: tx._id,
        amount: tx.amount,
        decision: tx.decision,
        priority: tx.priority,
        receiver: tx.receiver,
        location: tx.location?.city,
        createdAt: tx.createdAt
      })),
      riskTrend: riskLogs.reverse().map((log) => ({
        time: log.createdAt,
        score: log.finalRiskScore
      })),
      deviceHistory: sessions.map((session) => ({
        id: session._id,
        deviceId: session.deviceId,
        city: session.lastLocation?.city || "Unknown",
        lastSeenAt: session.lastSeenAt,
        isTrusted: session.isTrusted
      })),
      locationHistory: transactions.map((tx) => ({
        city: tx.location?.city || "Unknown",
        amount: tx.amount,
        createdAt: tx.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditTrail = async (req, res, next) => {
  try {
    const { userId, priority } = req.query;
    const query = {};
    if (userId) query.senderId = userId;
    if (priority) query.priority = priority;

    const logs = await RiskLog.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("senderId", "name email")
      .populate("transactionId");

    res.json({
      logs: logs.map((log) => ({
        id: log._id,
        user: log.senderId,
        transactionId: log.transactionId?._id,
        priority: log.priority,
        decision: log.decision,
        finalRiskScore: log.finalRiskScore,
        mlScore: log.mlScore,
        ruleSignals: log.ruleSignals,
        topFactors: log.topFactors,
        degradedMode: log.degradedMode,
        latencyMs: log.latencyMs,
        audit: log.audit,
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemStatus = async (req, res, next) => {
  try {
    const [latestLog, opsEvents] = await Promise.all([
      RiskLog.findOne().sort({ createdAt: -1 }),
      OpsEvent.find().sort({ createdAt: -1 }).limit(20)
    ]);

    const status = await getPlatformStatus(latestLog?.latencyMs || 0);
    res.json({
      status,
      opsEvents
    });
  } catch (error) {
    next(error);
  }
};

export const getGraphInsights = async (req, res, next) => {
  try {
    const graph = await Transaction.aggregate([
      {
        $group: {
          _id: { sender: "$sender", receiver: "$receiver" },
          transfers: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          maxRisk: { $max: "$finalRiskScore" }
        }
      },
      { $sort: { transfers: -1, maxRisk: -1 } },
      { $limit: 20 }
    ]);

    const userIds = [
      ...new Set(
        graph.flatMap((edge) => [edge._id.sender.toString(), edge._id.receiver.toString()])
      )
    ];
    const users = await User.find({ _id: { $in: userIds } }).select("name");
    const userMap = new Map(users.map((user) => [user._id.toString(), user.name]));

    res.json({
      connections: graph.map((edge) => ({
        senderId: edge._id.sender,
        senderName: userMap.get(edge._id.sender.toString()) || "Unknown",
        receiverId: edge._id.receiver,
        receiverName: userMap.get(edge._id.receiver.toString()) || "Unknown",
        transfers: edge.transfers,
        totalAmount: edge.totalAmount,
        maxRisk: edge.maxRisk,
        suspiciousCluster: edge.transfers >= 3 && edge.maxRisk >= 60
      }))
    });
  } catch (error) {
    next(error);
  }
};
