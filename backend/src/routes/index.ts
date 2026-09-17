import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { packageRoutes } from "./packageRoutes";
import { hotelRoutes } from "./hotelRoutes";
import { airlineRoutes } from "./airlineRoutes";
import { roomTypeRoutes } from "./roomTypeRoutes";
import { inquiryRoutes } from "./inquiryRoutes";
import { flightScheduleRoutes } from "./flightScheduleRoutes";
import { settingRoutes } from "./settingRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { adminUserRoutes } from "./adminUserRoutes";
import { auditRoutes } from "./auditRoutes";
import { uploadRoutes } from "./uploadRoutes";
import { umrahRoutes } from "./umrahRoutes";
import { reviewRoutes } from "./reviewRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/packages", packageRoutes);
router.use("/hotels", hotelRoutes);
router.use("/airlines", airlineRoutes);
router.use("/room-types", roomTypeRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/flights", flightScheduleRoutes);
router.use("/settings", settingRoutes);
router.use("/admin/dashboard", dashboardRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin/audit-logs", auditRoutes);
router.use("/admin/uploads", uploadRoutes);
router.use("/", umrahRoutes);

// Must be mounted after /umrah and /admin-specific routes. Because reviewRoutes
// declares fully-qualified paths (/reviews, /admin/reviews) this is a catch-all
// for those exact paths only and cannot shadow anything else.
router.use("/", reviewRoutes);

export { router as apiRoutes };