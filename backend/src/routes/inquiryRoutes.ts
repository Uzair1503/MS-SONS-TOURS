import { Router } from "express";
import { inquiryController } from "../controllers/inquiryController";
import { authenticate } from "../middleware/auth";
import { inquiryLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", authenticate, inquiryController.getAll);
router.get("/counts", authenticate, inquiryController.counts);
router.get("/:id", authenticate, inquiryController.getById);
router.post("/", inquiryLimiter, inquiryController.create);
router.put("/:id", authenticate, inquiryController.update);

export { router as inquiryRoutes };