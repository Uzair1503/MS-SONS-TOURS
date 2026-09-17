import { Router } from "express";
import { airlineController } from "../controllers/airlineController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, airlineController.getAll);
router.get("/:id", apiLimiter, airlineController.getById);

router.post("/", authenticate, requireAdmin, airlineController.create);
router.put("/:id", authenticate, requireAdmin, airlineController.update);
router.delete("/:id", authenticate, requireAdmin, airlineController.delete);

export { router as airlineRoutes };