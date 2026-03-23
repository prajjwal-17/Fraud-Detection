import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { recordLoginAttempt } from "../services/security.service.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role
    });
    const token = signToken({ sub: user._id, role: user.role });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const user = await User.findOne({ email });
    if (!user) {
      await recordLoginAttempt({ email, ip, success: false });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await recordLoginAttempt({ email, ip, success: false });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await recordLoginAttempt({ email, ip, success: true });
    const token = signToken({ sub: user._id, role: user.role });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
