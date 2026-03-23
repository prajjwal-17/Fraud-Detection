import mongoose from "mongoose";

const caseNoteSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

const caseSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      unique: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "FALSE_POSITIVE"],
      default: "OPEN"
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM"
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedToName: { type: String, default: null },
    notes: [caseNoteSchema],
    resolutionReason: { type: String, default: "" },
    latestRiskScore: { type: Number, default: 0 },
    mlScore: { type: Number, default: 0 },
    decision: { type: String, default: "SUSPICIOUS" }
  },
  { timestamps: true }
);

export const Case = mongoose.model("Case", caseSchema);

