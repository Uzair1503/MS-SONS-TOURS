import { Router } from "express";
import { uploadController } from "../controllers/uploadController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/hotel-image", apiLimiter, authenticate, requireAdmin, uploadController.hotelImage);

export { router as uploadRoutes };