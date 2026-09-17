import { Router } from "express";
import { reviewController } from "../controllers/reviewController";
import { uploadController } from "../controllers/uploadController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter, reviewLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public
router.get("/reviews", apiLimiter, reviewController.getPublic);
router.post("/reviews", apiLimiter, reviewLimiter, reviewController.create);
router.post("/reviews/image", apiLimiter, reviewLimiter, uploadController.reviewImage);

// Admin
router.get("/admin/reviews", apiLimiter, authenticate, requireAdmin, reviewController.getAll);
router.patch("/admin/reviews/:id", apiLimiter, authenticate, requireAdmin, reviewController.toggleApproval);
router.delete("/admin/reviews/:id", apiLimiter, authenticate, requireAdmin, reviewController.remove);

export { router as reviewRoutes };