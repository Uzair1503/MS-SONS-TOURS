import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthRequest } from "../types";

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.admin?.role;
  if (role !== "ADMIN" && role !== "STAFF") {
    res.status(403).json({ success: false, error: "Admin access required" });
    return;
  }
  next();
}