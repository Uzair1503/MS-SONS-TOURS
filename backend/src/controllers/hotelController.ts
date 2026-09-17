import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { hotelService } from "../services/hotelService";
import { AppError } from "../middleware/errorHandler";
import { hotelSchema } from "../validators";

function parseStarRating(value: any): number | null | undefined {
  const parsed = hotelSchema.pick({ starRating: true }).safeParse({ starRating: value });
  if (!parsed.success) throw new AppError("Star rating must be a whole number between 1 and 5", 400);
  return parsed.data.starRating;
}

export const hotelController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const requestedStar = req.query.starRating !== undefined ? parseInt(req.query.starRating) : undefined;
      const starRating = requestedStar && requestedStar >= 1 && requestedStar <= 5 ? requestedStar : undefined;
      const result = await hotelService.getAll({
        city: req.query.city,
        category: req.query.category,
        search: req.query.search,
        active: req.query.active !== undefined ? req.query.active === "true" : undefined,
        starRating,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
      });
      res.json({
        success: true,
        data: result.hotels,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: any, res: Response, next: NextFunction) {
    try {
      const hotel = await hotelService.getById(req.params.id);
      res.json({ success: true, data: hotel });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      req.body.starRating = parseStarRating(req.body.starRating);
      const hotel = await hotelService.create(req.body, req.admin?.id);
      res.status(201).json({ success: true, data: hotel });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      req.body.starRating = parseStarRating(req.body.starRating);
      const hotel = await hotelService.update(req.params.id, req.body, req.admin?.id);
      res.json({ success: true, data: hotel });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await hotelService.delete(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async counts(req: any, res: Response, next: NextFunction) {
    try {
      const result = await hotelService.counts();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};