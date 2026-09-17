import { Router } from "express";
import { umrahController } from "../controllers/umrahController";
import { customPackageController } from "../controllers/customPackageController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public
router.get("/umrah/settings", apiLimiter, umrahController.getSettings);
router.post("/custom-package/calculate", apiLimiter, customPackageController.calculate);

// Admin
router.get("/admin/umrah/settings", authenticate, requireAdmin, umrahController.getAdminSettings);
router.put("/admin/umrah/settings", authenticate, requireAdmin, umrahController.update);

export { router as umrahRoutes };