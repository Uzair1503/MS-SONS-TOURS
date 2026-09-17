import { Router } from "express";
import { flightScheduleController } from "../controllers/flightScheduleController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, flightScheduleController.getAll);

router.post("/", authenticate, requireAdmin, flightScheduleController.create);
router.put("/:id", authenticate, requireAdmin, flightScheduleController.update);
router.delete("/:id", authenticate, requireAdmin, flightScheduleController.delete);

export { router as flightScheduleRoutes };