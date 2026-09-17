import { Response, NextFunction } from "express";
import { auditService } from "../services/auditService";

export const auditController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await auditService.getAll({
        entity: req.query.entity,
        adminId: req.query.adminId,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
      });
      res.json({
        success: true,
        data: result.logs,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },
};