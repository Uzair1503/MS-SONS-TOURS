import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const airlineRepository = {
  async findMany(filters?: { active?: boolean; search?: string; page?: number; limit?: number }) {
    const where: Prisma.AirlineWhereInput = {};
    if (filters?.active !== undefined) where.active = filters.active;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const airlines = await prisma.airline.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { packages: true } } },
    });
    const total = await prisma.airline.count({ where });
    return { airlines, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.airline.findUnique({ where: { id }, include: { packages: true } });
  },

  async create(data: Prisma.AirlineCreateInput) {
    return prisma.airline.create({ data });
  },

  async update(id: string, data: Prisma.AirlineUpdateInput) {
    return prisma.airline.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.airline.delete({ where: { id } });
  },
};