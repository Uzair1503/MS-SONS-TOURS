import { Router } from "express";
import { roomTypeController } from "../controllers/roomTypeController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, roomTypeController.getAll);
router.get("/:id", apiLimiter, roomTypeController.getById);

router.post("/", authenticate, requireAdmin, roomTypeController.create);
router.put("/:id", authenticate, requireAdmin, roomTypeController.update);
router.delete("/:id", authenticate, requireAdmin, roomTypeController.delete);

export { router as roomTypeRoutes };