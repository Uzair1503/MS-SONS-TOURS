import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { airlineService } from "../services/airlineService";

export const airlineController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await airlineService.getAll({
        active: req.query.active !== undefined ? req.query.active === "true" : undefined,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
      });
      res.json({
        success: true,
        data: result.airlines,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: any, res: Response, next: NextFunction) {
    try {
      const airline = await airlineService.getById(req.params.id);
      res.json({ success: true, data: airline });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const airline = await airlineService.create(req.body, req.admin?.id);
      res.status(201).json({ success: true, data: airline });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const airline = await airlineService.update(req.params.id, req.body, req.admin?.id);
      res.json({ success: true, data: airline });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await airlineService.delete(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};