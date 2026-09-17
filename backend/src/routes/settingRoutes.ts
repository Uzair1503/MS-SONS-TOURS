import { Router } from "express";
import { settingController } from "../controllers/settingController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/public", settingController.getPublic);
router.get("/", authenticate, settingController.getAll);
router.post("/", authenticate, requireAdmin, settingController.set);
router.post("/bulk", authenticate, requireAdmin, settingController.setMany);
router.delete("/:key", authenticate, requireAdmin, settingController.delete);

export { router as settingRoutes };