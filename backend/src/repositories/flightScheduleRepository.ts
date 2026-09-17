import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const flightScheduleRepository = {
  async findMany(filters?: { airlineId?: string; page?: number; limit?: number }) {
    const where: Prisma.FlightScheduleWhereInput = {};
    if (filters?.airlineId) where.airlineId = filters.airlineId;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const [flights, total] = await Promise.all([
      prisma.flightSchedule.findMany({
        where,
        include: { airline: true },
        orderBy: { departureDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.flightSchedule.count({ where }),
    ]);
    return { flights, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(data: Prisma.FlightScheduleCreateInput) {
    return prisma.flightSchedule.create({ data, include: { airline: true } });
  },

  async update(id: string, data: Prisma.FlightScheduleUpdateInput) {
    return prisma.flightSchedule.update({ where: { id }, data, include: { airline: true } });
  },

  async delete(id: string) {
    return prisma.flightSchedule.delete({ where: { id } });
  },
};