import { Router } from "express";
import { hotelController } from "../controllers/hotelController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, hotelController.getAll);
router.get("/counts", apiLimiter, hotelController.counts);
router.get("/:id", apiLimiter, hotelController.getById);

router.post("/", authenticate, requireAdmin, hotelController.create);
router.put("/:id", authenticate, requireAdmin, hotelController.update);
router.delete("/:id", authenticate, requireAdmin, hotelController.delete);

export { router as hotelRoutes };