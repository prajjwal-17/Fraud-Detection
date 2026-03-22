import { Router } from "express";
import {
  getRecentTransactions,
  simulateTransaction
} from "../controllers/transaction.controller.js";
import { adminOnly, authRequired } from "../middleware/auth.js";

const router = Router();

router.post("/simulate", authRequired, adminOnly, simulateTransaction);
router.get("/recent", authRequired, getRecentTransactions);

export default router;
