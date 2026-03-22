import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { processTransaction } from "../services/riskEngine.service.js";
import { generateSimulationPayload } from "../utils/generateTransaction.js";

export const simulateTransaction = async (req, res, next) => {
  try {
    let payload = req.body;

    if (payload.mode && payload.mode !== "manual") {
      let sender;
      let receiver;

      if (payload.senderId && payload.receiverId) {
        [sender, receiver] = await Promise.all([
          User.findById(payload.senderId),
          User.findById(payload.receiverId)
        ]);
      } else {
        const users = await User.find({ role: "user" }).limit(3);
        if (users.length < 2) {
          return res.status(400).json({ message: "Not enough users to simulate" });
        }
        [sender, receiver] = users;
      }

      if (!sender || !receiver) {
        return res.status(404).json({ message: "Selected users not found" });
      }

      const generatedPayload = generateSimulationPayload({
        sender,
        receiver,
        mode: payload.mode
      });

      payload = {
        ...generatedPayload,
        ...payload,
        senderId: sender._id,
        receiverId: receiver._id,
        deviceId: payload.deviceId || generatedPayload.deviceId,
        amount: payload.amount || generatedPayload.amount,
        location: payload.location
          ? {
              ...generatedPayload.location,
              ...payload.location
            }
          : generatedPayload.location
      };
    }

    if (payload.mode === "manual") {
      payload = {
        ...payload,
        deviceId: payload.deviceId || "manual-device",
        location: payload.location || { city: "Unknown" }
      };
    }

    const result = await processTransaction(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getRecentTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(25)
      .populate("sender receiver", "name email");

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};
