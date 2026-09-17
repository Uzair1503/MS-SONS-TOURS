import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { auditRepository } from "../repositories/auditRepository";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const adminUserService = {
  async getAll(filters?: { search?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminUser.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(data: { name: string; email: string; password?: string; role?: string; active?: boolean }, adminId?: string) {
    const exists = await prisma.adminUser.findUnique({ where: { email: data.email } });
    if (exists) throw new AppError("A user with this email already exists", 409);

    const password = data.password || "password123";
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: data.role === "ADMIN" ? "ADMIN" : "STAFF",
        active: data.active ?? true,
      },
      select: userSelect,
    });

    if (adminId) await auditRepository.log({ adminId, action: "created", entity: "adminUser", entityId: user.id });
    return user;
  },

  async update(
    id: string,
    data: { name?: string; email?: string; password?: string; role?: string; active?: boolean },
    adminId?: string
  ) {
    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role === "ADMIN" ? "ADMIN" : "STAFF";
    if (data.active !== undefined) updateData.active = data.active;
    if (data.email !== undefined && data.email !== user.email) {
      const exists = await prisma.adminUser.findUnique({ where: { email: data.email } });
      if (exists) throw new AppError("A user with this email already exists", 409);
      updateData.email = data.email;
    }
    if (data.password) updateData.password = await bcrypt.hash(data.password, 10);

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });

    if (adminId) await auditRepository.log({ adminId, action: "updated", entity: "adminUser", entityId: id });
    return updated;
  },

  async remove(id: string, adminId?: string) {
    if (id === adminId) throw new AppError("You cannot delete your own account", 400);
    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    await prisma.adminUser.delete({ where: { id } });
    if (adminId) await auditRepository.log({ adminId, action: "deleted", entity: "adminUser", entityId: id });
    return { message: "User deleted successfully" };
  },
};