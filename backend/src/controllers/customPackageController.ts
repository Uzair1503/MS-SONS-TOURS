import { Response, NextFunction } from "express";
import { customPackageService } from "../services/customPackageService";

export const customPackageController = {
  async calculate(req: any, res: Response, next: NextFunction) {
    try {
      const data = await customPackageService.calculate(req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};