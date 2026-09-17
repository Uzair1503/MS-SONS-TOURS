import { Response, NextFunction } from "express";
import { packageService } from "../services/packageService";
import { hotelService } from "../services/hotelService";
import { airlineService } from "../services/airlineService";
import { roomTypeService } from "../services/roomTypeService";
import { inquiryService } from "../services/inquiryService";
import { auditRepository } from "../repositories/auditRepository";

export const dashboardController = {
  async getStats(req: any, res: Response, next: NextFunction) {
    try {
      const [packageCounts, hotelCounts, airlineResult, roomTypes, inquiryCounts, recentInquiries, recentAuditLogs] =
        await Promise.all([
          packageService.counts(),
          hotelService.counts(),
          airlineService.getAll({ limit: 100 }),
          roomTypeService.getAll(),
          inquiryService.counts(),
          inquiryService.getAll({ limit: 5, page: 1 }),
          auditRepository.findMany({ limit: 10 }),
        ]);

      res.json({
        success: true,
        data: {
          packages: packageCounts,
          hotels: hotelCounts,
          airlines: { total: airlineResult.total },
          roomTypes: { total: roomTypes.length },
          inquiries: inquiryCounts,
          recentInquiries: recentInquiries.inquiries,
          recentAuditLogs: recentAuditLogs.logs,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};