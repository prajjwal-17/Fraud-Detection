import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: { type: Number, required: true },
    deviceId: { type: String, required: true },
    mode: {
      type: String,
      enum: ["normal", "fraud", "manual"],
      default: "manual"
    },
    location: {
      city: String,
      lat: Number,
      lng: Number
    },
    mlScore: { type: Number, default: 0 },
    finalRiskScore: { type: Number, default: 0 },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    decision: {
      type: String,
      enum: ["SAFE", "SUSPICIOUS", "FRAUD"],
      default: "SAFE"
    },
    rulesTriggered: [{ type: String }],
    status: {
      type: String,
      enum: ["processed", "held", "blocked"],
      default: "processed"
    }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
