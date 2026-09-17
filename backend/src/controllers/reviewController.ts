import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { reviewService } from "../services/reviewService";
import { reviewSchema } from "../validators";
import { saveReviewImage } from "./uploadController";

export const reviewController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.getAll({
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 100,
      });
      res.json({
        success: true,
        data: result.reviews,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async getPublic(req: any, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.getAll({ page: 1, limit: req.query.limit ? parseInt(req.query.limit) : 100 });
      const approved = reviews.reviews.filter((r: any) => r.isApproved);
      res.json({ success: true, data: approved });
    } catch (err) {
      next(err);
    }
  },

  async create(req: any, res: Response, next: NextFunction) {
    try {
      const parsed = reviewSchema.parse(req.body);
      let imageUrl: string | undefined;
      if (parsed.image) {
        imageUrl = await saveReviewImage(parsed.image.name, parsed.image.data);
      }
      const review = await reviewService.create({
        name: parsed.name,
        city: parsed.city || null,
        rating: parsed.rating,
        comment: parsed.comment,
        imageUrl: imageUrl || null,
        isApproved: true,
      });
      res.status(201).json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },

  async toggleApproval(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.toggleApproval(req.params.id, req.admin?.id);
      res.json({ success: true, data: review });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await reviewService.delete(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};