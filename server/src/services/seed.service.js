import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { logger } from "../config/logger.js";

const defaultUsers = [
  {
    name: "FraudOps Admin",
    email: "admin@finsecure.ai",
    password: "Admin@123",
    role: "admin",
    homeLocation: { city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    trustedDevices: ["device-admin-mac"]
  },
  {
    name: "Aarav Mehta",
    email: "user1@finsecure.ai",
    password: "User@123",
    role: "user",
    homeLocation: { city: "Mumbai", lat: 19.076, lng: 72.8777 },
    trustedDevices: ["device-iphone-14"]
  },
  {
    name: "Diya Sharma",
    email: "user2@finsecure.ai",
    password: "User@123",
    role: "user",
    homeLocation: { city: "Delhi", lat: 28.6139, lng: 77.209 },
    trustedDevices: ["device-pixel-8"]
  },
  {
    name: "Kabir Nair",
    email: "user3@finsecure.ai",
    password: "User@123",
    role: "user",
    homeLocation: { city: "Hyderabad", lat: 17.385, lng: 78.4867 },
    trustedDevices: ["device-oneplus-12"]
  }
];

export const seedDefaultUsers = async () => {
  const count = await User.countDocuments();
  if (count > 0) {
    return;
  }

  const records = await Promise.all(
    defaultUsers.map(async (user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      homeLocation: user.homeLocation,
      trustedDevices: user.trustedDevices,
      passwordHash: await bcrypt.hash(user.password, 10)
    }))
  );

  await User.insertMany(records);
  logger.info({ message: "Seeded default users" });
};
