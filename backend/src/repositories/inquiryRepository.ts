import { Prisma, InquiryStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export const inquiryRepository = {
  async findMany(filters?: { status?: string; search?: string; page?: number; limit?: number }) {
    const where: Prisma.BookingInquiryWhereInput = {};
    if (filters?.status) where.status = filters.status as InquiryStatus;
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { whatsappNumber: { contains: filters.search } },
        { referenceNumber: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const [inquiries, total] = await Promise.all([
      prisma.bookingInquiry.findMany({
        where,
        include: { package: { select: { title: true, durationDays: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookingInquiry.count({ where }),
    ]);
    return { inquiries, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async findById(id: string) {
    return prisma.bookingInquiry.findUnique({
      where: { id },
      include: { package: { include: { airline: true, roomPrices: { include: { roomType: true } } } } },
    });
  },

  async create(data: Prisma.BookingInquiryCreateInput) {
    return prisma.bookingInquiry.create({ data });
  },

  async update(id: string, data: Prisma.BookingInquiryUpdateInput) {
    return prisma.bookingInquiry.update({ where: { id }, data });
  },

  async counts() {
    const [total, newCount, confirmed] = await Promise.all([
      prisma.bookingInquiry.count(),
      prisma.bookingInquiry.count({ where: { status: "NEW" } }),
      prisma.bookingInquiry.count({ where: { status: "CONFIRMED" } }),
    ]);
    return { total, newCount, confirmed };
  },
};