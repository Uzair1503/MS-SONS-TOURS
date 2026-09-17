import { Prisma, PackageStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { PackageFilters } from "../types";

export const packageRepository = {
  async findMany(filters: PackageFilters) {
    const where: Prisma.PackageWhereInput = {};

    if (filters.durationDays) where.durationDays = filters.durationDays;
    if (filters.airlineId) where.airlineId = filters.airlineId;
    if (filters.status) where.status = filters.status as PackageStatus;
    if (filters.makkahHotelId) where.makkahHotelId = filters.makkahHotelId;
    if (filters.madinahHotelId) where.madinahHotelId = filters.madinahHotelId;
    if (filters.departureDate) {
      where.departureDate = { gte: new Date(filters.departureDate) };
    }
    if (filters.returnDate) {
      where.returnDate = { lte: new Date(filters.returnDate) };
    }

    const orFilters: Prisma.PackageWhereInput[] = [];
    if (filters.search) {
      orFilters.push({
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { packageCode: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { provider: { contains: filters.search, mode: "insensitive" } },
        ],
      });
    }
    if (filters.hotelId) {
      orFilters.push({ OR: [{ makkahHotelId: filters.hotelId }, { madinahHotelId: filters.hotelId }] });
    }
    if (filters.hotelRefId) {
      const packageHotels = await prisma.packageHotel.findMany({
        where: { hotelId: filters.hotelRefId },
        select: { id: true },
      });
      const packageHotelIds = packageHotels.map((ph) => ph.id);
      if (packageHotelIds.length > 0) {
        orFilters.push({
          OR: [{ makkahHotelId: { in: packageHotelIds } }, { madinahHotelId: { in: packageHotelIds } }],
        });
      }
    }
    if (orFilters.length > 0) {
      if (orFilters.length === 1) where.OR = orFilters[0].OR as Prisma.PackageWhereInput[];
      else where.AND = orFilters;
    }

    const roomPriceClause: Prisma.PackageRoomPriceWhereInput = {};
    if (filters.roomTypeId) roomPriceClause.roomTypeId = filters.roomTypeId;
    if (filters.minPrice || filters.maxPrice) {
      roomPriceClause.price = {};
      if (filters.minPrice) roomPriceClause.price.gte = filters.minPrice;
      if (filters.maxPrice) roomPriceClause.price.lte = filters.maxPrice;
    }
    if (Object.keys(roomPriceClause).length > 0) {
      where.roomPrices = { some: roomPriceClause };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const sortBy = filters.sortBy || "sortOrder";
    const sortOrder = filters.sortOrder || "asc";

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          airline: true,
          roomPrices: {
            include: { roomType: true },
            orderBy: { price: "asc" },
          },
          makkahHotel: { include: { hotel: true } },
          madinahHotel: { include: { hotel: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.package.count({ where }),
    ]);

    return { packages, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.package.findUnique({
      where: { id },
      include: {
        airline: true,
        roomPrices: {
          include: { roomType: true },
          orderBy: { price: "asc" },
        },
        makkahHotel: { include: { hotel: true } },
        madinahHotel: { include: { hotel: true } },
      },
    });
  },

  async findByDuration(days: number, filters?: PackageFilters) {
    return this.findMany({ ...filters, durationDays: days });
  },

  async findFeatured(days: number, limit: number = 6) {
    return prisma.package.findMany({
      where: {
        durationDays: days,
        status: "ACTIVE",
      },
      include: {
        airline: true,
        roomPrices: {
          include: { roomType: true },
          orderBy: { price: "asc" },
        },
        makkahHotel: { include: { hotel: true } },
        madinahHotel: { include: { hotel: true } },
      },
      orderBy: { sortOrder: "asc" },
      take: limit,
    });
  },

  async create(data: Prisma.PackageCreateInput) {
    return prisma.package.create({
      data,
      include: {
        airline: true,
        roomPrices: { include: { roomType: true } },
        makkahHotel: { include: { hotel: true } },
        madinahHotel: { include: { hotel: true } },
      },
    });
  },

  async update(id: string, data: Prisma.PackageUpdateInput) {
    return prisma.package.update({
      where: { id },
      data,
      include: {
        airline: true,
        roomPrices: { include: { roomType: true } },
        makkahHotel: { include: { hotel: true } },
        madinahHotel: { include: { hotel: true } },
      },
    });
  },

  async delete(id: string) {
    return prisma.package.delete({ where: { id } });
  },

  async counts() {
    const [total, active, days14, days21] = await Promise.all([
      prisma.package.count(),
      prisma.package.count({ where: { status: "ACTIVE" } }),
      prisma.package.count({ where: { durationDays: 14 } }),
      prisma.package.count({ where: { durationDays: 21 } }),
    ]);
    return { total, active, days14, days21 };
  },
};