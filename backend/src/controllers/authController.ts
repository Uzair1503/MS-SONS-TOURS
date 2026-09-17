import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";
import { AuthRequest } from "../types";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });
  },

  async profile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.admin!.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  },
};