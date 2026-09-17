import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { settingService } from "../services/settingService";

export const settingController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getMany(req.query.category);
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async getPublic(req: any, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getAll();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  async set(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key, value, category } = req.body;
      const setting = await settingService.set(key, value, category);
      res.json({ success: true, data: setting });
    } catch (err) {
      next(err);
    }
  },

  async setMany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { settings } = req.body;
      const results = [];
      for (const s of settings) {
        const result = await settingService.set(s.key, s.value, s.category || "general");
        results.push(result);
      }
      res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await settingService.delete(req.params.key);
      res.json({ success: true, message: "Setting deleted" });
    } catch (err) {
      next(err);
    }
  },
};