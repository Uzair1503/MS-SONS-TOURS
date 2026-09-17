import { Router } from "express";
import { auditController } from "../controllers/auditController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, authenticate, requireAdmin, auditController.getAll);

export { router as auditRoutes };