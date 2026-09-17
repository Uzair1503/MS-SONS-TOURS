import { Router } from "express";
import { packageController } from "../controllers/packageController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, packageController.getAll);
router.get("/featured/:days", apiLimiter, packageController.getFeatured);
router.get("/duration/:days", apiLimiter, packageController.getByDuration);
router.get("/counts", apiLimiter, packageController.counts);
router.post("/calculate", apiLimiter, packageController.calculate);
router.get("/:id", apiLimiter, packageController.getById);

router.post("/", authenticate, requireAdmin, packageController.create);
router.put("/:id", authenticate, requireAdmin, packageController.update);
router.delete("/:id", authenticate, requireAdmin, packageController.delete);

export { router as packageRoutes };