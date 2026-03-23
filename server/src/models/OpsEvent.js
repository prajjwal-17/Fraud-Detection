import mongoose from "mongoose";

const opsEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    severity: {
      type: String,
      enum: ["INFO", "WARN", "ERROR", "CRITICAL"],
      default: "INFO"
    },
    message: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      default: null
    },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const OpsEvent = mongoose.model("OpsEvent", opsEventSchema);
