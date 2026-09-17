import { Router } from "express";
import { adminUserController } from "../controllers/adminUserController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, authenticate, requireAdmin, adminUserController.getAll);
router.post("/", apiLimiter, authenticate, requireAdmin, adminUserController.create);
router.put("/:id", apiLimiter, authenticate, requireAdmin, adminUserController.update);
router.delete("/:id", apiLimiter, authenticate, requireAdmin, adminUserController.remove);

export { router as adminUserRoutes };