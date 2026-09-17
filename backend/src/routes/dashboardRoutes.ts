import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, requireAdmin, dashboardController.getStats);

export { router as dashboardRoutes };