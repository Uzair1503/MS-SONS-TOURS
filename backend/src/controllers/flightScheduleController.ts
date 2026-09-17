import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { flightScheduleService } from "../services/flightScheduleService";

export const flightScheduleController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await flightScheduleService.getAll({
        airlineId: req.query.airlineId,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
      });
      res.json({
        success: true,
        data: result.flights,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const flight = await flightScheduleService.create(req.body, req.admin?.id);
      res.status(201).json({ success: true, data: flight });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const flight = await flightScheduleService.update(req.params.id, req.body, req.admin?.id);
      res.json({ success: true, data: flight });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await flightScheduleService.delete(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};