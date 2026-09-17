import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { inquiryService } from "../services/inquiryService";

export const inquiryController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await inquiryService.getAll({
        status: req.query.status,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
      });
      res.json({
        success: true,
        data: result.inquiries,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: any, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.getById(req.params.id);
      res.json({ success: true, data: inquiry });
    } catch (err) {
      next(err);
    }
  },

  async create(req: any, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.create(req.body);
      res.status(201).json({ success: true, data: inquiry });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.update(req.params.id, req.body, req.admin?.id);
      res.json({ success: true, data: inquiry });
    } catch (err) {
      next(err);
    }
  },

  async counts(req: any, res: Response, next: NextFunction) {
    try {
      const result = await inquiryService.counts();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};