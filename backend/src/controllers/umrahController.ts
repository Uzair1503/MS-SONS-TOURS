import { Response, NextFunction } from "express";
import { umrahService } from "../services/umrahService";

export const umrahController = {
  // Public settings used by the Custom Package builder & rates display.
  async getSettings(_req: any, res: Response, next: NextFunction) {
    try {
      const data = await umrahService.getSettings();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  // Admin view (fresh read).
  async getAdminSettings(_req: any, res: Response, next: NextFunction) {
    try {
      const data = await umrahService.getSettings(true);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async update(req: any, res: Response, next: NextFunction) {
    try {
      const data = await umrahService.update(req.body, req.admin?.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};