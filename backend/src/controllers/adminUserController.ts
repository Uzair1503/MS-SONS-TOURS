import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { adminUserService } from "../services/adminUserService";
import { adminUserSchema } from "../validators";

export const adminUserController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await adminUserService.getAll({
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
      });
      res.json({
        success: true,
        data: result.users,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = adminUserSchema.parse(req.body);
      const user = await adminUserService.create(parsed, req.admin?.id);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = adminUserSchema.partial().parse(req.body);
      if (parsed.password === undefined) delete parsed.password;
      const user = await adminUserService.update(req.params.id, parsed, req.admin?.id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminUserService.remove(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};