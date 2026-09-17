import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const auditRepository = {
  async log(data: {
    adminId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }) {
    return prisma.auditLog.create({ data });
  },

  async findMany(filters?: { entity?: string; adminId?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.adminId) where.adminId = filters.adminId;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};