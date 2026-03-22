import mongoose from "mongoose";

const riskLogSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mlScore: { type: Number, required: true },
    anomalyScore: { type: Number, default: 0 },
    ruleSignals: [{ type: String }],
    finalRiskScore: { type: Number, required: true },
    decision: { type: String, required: true },
    topFactors: [{ type: String }],
    latencyMs: { type: Number, default: 0 },
    audit: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const RiskLog = mongoose.model("RiskLog", riskLogSchema);
