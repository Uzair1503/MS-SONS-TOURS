import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const reviewRepository = {
  async findPublic() {
    return prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findAll(filters?: { page?: number; limit?: number }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 100;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count(),
    ]);
    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.review.findUnique({ where: { id } });
  },

  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({ data });
  },

  async setApproval(id: string, isApproved: boolean) {
    return prisma.review.update({ where: { id }, data: { isApproved } });
  },

  async delete(id: string) {
    return prisma.review.delete({ where: { id } });
  },
};