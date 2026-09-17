import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { roomTypeService } from "../services/roomTypeService";

export const roomTypeController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const result = await roomTypeService.getAll();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: any, res: Response, next: NextFunction) {
    try {
      const rt = await roomTypeService.getById(req.params.id);
      res.json({ success: true, data: rt });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rt = await roomTypeService.create(req.body, req.admin?.id);
      res.status(201).json({ success: true, data: rt });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rt = await roomTypeService.update(req.params.id, req.body, req.admin?.id);
      res.json({ success: true, data: rt });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await roomTypeService.delete(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};