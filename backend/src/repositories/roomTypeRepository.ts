import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const roomTypeRepository = {
  async findMany(filters?: { active?: boolean }) {
    const where: Prisma.RoomTypeWhereInput = {};
    if (filters?.active !== undefined) where.active = filters.active;
    return prisma.roomType.findMany({ where, orderBy: { name: "asc" } });
  },

  async findById(id: string) {
    return prisma.roomType.findUnique({ where: { id } });
  },

  async findByName(name: string) {
    return prisma.roomType.findFirst({ where: { name } });
  },

  async create(data: Prisma.RoomTypeCreateInput) {
    return prisma.roomType.create({ data });
  },

  async update(id: string, data: Prisma.RoomTypeUpdateInput) {
    return prisma.roomType.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.hotelRoomPrice.deleteMany({ where: { roomTypeId: id } });
      await tx.packageRoomPrice.deleteMany({ where: { roomTypeId: id } });
      return tx.roomType.delete({ where: { id } });
    });
  },
};