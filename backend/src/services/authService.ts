import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { config } from "../config";
import { AppError } from "../middleware/errorHandler";

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password", 401);
    if (!user.active) throw new AppError("Account is deactivated", 403);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError("Invalid email or password", 401);

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },

  async getProfile(adminId: string) {
    const user = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
    });
    if (!user) throw new AppError("User not found", 404);
    return user;
  },
};