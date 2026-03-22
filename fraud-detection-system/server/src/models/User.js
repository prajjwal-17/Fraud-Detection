import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    homeLocation: {
      city: String,
      lat: Number,
      lng: Number
    },
    trustedDevices: [{ type: String }],
    profile: {
      averageAmount: { type: Number, default: 2500 },
      dailyVolume: { type: Number, default: 0 },
      riskLevel: { type: Number, default: 12 }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
