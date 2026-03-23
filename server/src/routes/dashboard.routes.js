import { Router } from "express";
import {
  getAlerts,
  getAuditTrail,
  getCases,
  getGraphInsights,
  getOverview,
  getSystemStatus,
  getTransactionDetail,
  getUserProfile,
  updateCase
} from "../controllers/dashboard.controller.js";
import { adminOnly, authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/overview", authRequired, adminOnly, getOverview);
router.get("/alerts", authRequired, adminOnly, getAlerts);
router.get("/cases", authRequired, adminOnly, getCases);
router.patch("/cases/:id", authRequired, adminOnly, updateCase);
router.get("/transactions/:id", authRequired, adminOnly, getTransactionDetail);
router.get("/users/:id/profile", authRequired, adminOnly, getUserProfile);
router.get("/audit-trail", authRequired, adminOnly, getAuditTrail);
router.get("/system-status", authRequired, adminOnly, getSystemStatus);
router.get("/graph-insights", authRequired, adminOnly, getGraphInsights);

export default router;
