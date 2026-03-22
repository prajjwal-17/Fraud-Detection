import { Router } from "express";
import {
  getAlerts,
  getOverview
} from "../controllers/dashboard.controller.js";
import { adminOnly, authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/overview", authRequired, adminOnly, getOverview);
router.get("/alerts", authRequired, adminOnly, getAlerts);

export default router;
