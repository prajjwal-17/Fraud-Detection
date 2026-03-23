import mongoose from "mongoose";

const deviceSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deviceId: { type: String, required: true },
    lastLocation: {
      city: String,
      lat: Number,
      lng: Number
    },
    lastSeenAt: { type: Date, default: Date.now },
    isTrusted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

deviceSessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const DeviceSession = mongoose.model(
  "DeviceSession",
  deviceSessionSchema
);
