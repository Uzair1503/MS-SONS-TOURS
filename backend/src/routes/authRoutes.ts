import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/login", authLimiter, authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.profile);

export { router as authRoutes };