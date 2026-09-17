import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export const hotelRepository = {
  async findMany(filters?: { city?: string; category?: string; search?: string; active?: boolean; starRating?: number; page?: number; limit?: number }) {
    const where: Prisma.HotelWhereInput = {};
    if (filters?.city) where.city = filters.city;
    if (filters?.category) where.category = filters.category as any;
    if (filters?.active !== undefined) where.active = filters.active;
    if (filters?.starRating !== undefined) where.starRating = filters.starRating;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { roomPrices: { include: { roomType: true }, orderBy: { createdAt: "asc" } } },
      }),
      prisma.hotel.count({ where }),
    ]);
    return { hotels, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.hotel.findUnique({ where: { id }, include: { roomPrices: { include: { roomType: true }, orderBy: { createdAt: "asc" } } } });
  },

  async create(
    data: Prisma.HotelCreateInput,
    roomPrices?: Array<{ roomTypeId: string; price: number; available: boolean }>
  ) {
    return prisma.$transaction(async (tx) => {
      const hotel = await tx.hotel.create({
        data,
        include: { roomPrices: { include: { roomType: true }, orderBy: { createdAt: "asc" } } },
      });
      if (roomPrices && roomPrices.length > 0) {
        for (const rp of roomPrices) {
          await tx.hotelRoomPrice.create({
            data: { hotelId: hotel.id, roomTypeId: rp.roomTypeId, price: rp.price, available: rp.available },
          });
        }
      }
      return hotel;
    });
  },

  async update(
    id: string,
    data: Prisma.HotelUpdateInput,
    roomPrices?: Array<{ roomTypeId: string; price: number; available: boolean }>
  ) {
    return prisma.$transaction(async (tx) => {
      if (roomPrices) {
        await tx.hotelRoomPrice.deleteMany({
          where: { hotelId: id, roomTypeId: { notIn: roomPrices.map((rp) => rp.roomTypeId) } },
        });
      }

      await tx.hotel.update({ where: { id }, data });

      if (roomPrices) {
        for (const rp of roomPrices) {
          await tx.hotelRoomPrice.upsert({
            where: { hotelId_roomTypeId: { hotelId: id, roomTypeId: rp.roomTypeId } },
            update: { price: rp.price, available: rp.available },
            create: { hotelId: id, roomTypeId: rp.roomTypeId, price: rp.price, available: rp.available },
          });
        }
      }

      return tx.hotel.update({
        where: { id },
        data: {},
        include: { roomPrices: { include: { roomType: true }, orderBy: { createdAt: "asc" } } },
      });
    });
  },

  async delete(id: string) {
    return prisma.hotel.delete({ where: { id } });
  },

  async counts() {
    const [total, makkah, madinah] = await Promise.all([
      prisma.hotel.count(),
      prisma.hotel.count({ where: { city: "Makkah" } }),
      prisma.hotel.count({ where: { city: "Madinah" } }),
    ]);
    return { total, makkah, madinah };
  },
};