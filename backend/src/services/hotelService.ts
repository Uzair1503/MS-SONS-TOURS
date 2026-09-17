import { cache } from "../cache";
import { prisma } from "../config/prisma";
import { auditRepository } from "../repositories/auditRepository";
import { hotelRepository } from "../repositories/hotelRepository";
import { AppError } from "../middleware/errorHandler";

function normalizeRoomPrices(roomPrices?: any[]) {
  if (!Array.isArray(roomPrices)) return undefined;
  const seen = new Set<string>();
  return roomPrices
    .filter((rp) => rp.roomTypeId)
    .map((rp) => ({ roomTypeId: rp.roomTypeId, price: Number(rp.price) || 0, available: rp.available ?? true }))
    .filter((rp) => (seen.has(rp.roomTypeId) ? false : (seen.add(rp.roomTypeId), true)));
}

export const hotelService = {
  async getAll(filters?: any) {
    const key = cache.hotelKey(JSON.stringify(filters || {}));
    const cached = await cache.get(key);
    if (cached) return cached;
    const result = await hotelRepository.findMany(filters);
    await cache.set(key, result, 300);
    return result;
  },

  async getById(id: string) {
    const cached = await cache.get(cache.hotelDetailKey(id));
    if (cached) return cached;
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw new AppError("Hotel not found", 404);
    await cache.set(cache.hotelDetailKey(id), hotel, 300);
    return hotel;
  },

  async create(data: any, adminId?: string) {
    const { roomPrices, ...hotelData } = data;
    const hotel = await hotelRepository.create(hotelData, normalizeRoomPrices(roomPrices));
    await cache.invalidateHotels();
    if (adminId) await auditRepository.log({ adminId, action: "created", entity: "hotel", entityId: hotel.id });
    return hotel;
  },

  async update(id: string, data: any, adminId?: string) {
    const existing = await hotelRepository.findById(id);
    if (!existing) throw new AppError("Hotel not found", 404);
    const { roomPrices, ...hotelData } = data;
    const hotel = await hotelRepository.update(id, hotelData, normalizeRoomPrices(roomPrices));
    await cache.invalidateHotels();
    if (adminId) await auditRepository.log({ adminId, action: "updated", entity: "hotel", entityId: id });
    return hotel;
  },

  async delete(id: string, adminId?: string) {
    const existing = await hotelRepository.findById(id);
    if (!existing) throw new AppError("Hotel not found", 404);

    const packageHotels = await prisma.packageHotel.findMany({ where: { hotelId: id } });
    for (const ph of packageHotels) {
      const usedInPackages = await prisma.package.count({
        where: { OR: [{ makkahHotelId: ph.id }, { madinahHotelId: ph.id }] },
      });
      if (usedInPackages > 0) {
        throw new AppError(
          `Cannot delete hotel: it is used in ${usedInPackages} package(s). Remove it from those packages first.`,
          400
        );
      }
      await prisma.packageHotel.delete({ where: { id: ph.id } });
    }

    await hotelRepository.delete(id);
    await cache.invalidateHotels();
    if (adminId) await auditRepository.log({ adminId, action: "deleted", entity: "hotel", entityId: id });
    return { message: "Hotel deleted successfully" };
  },

  async counts() {
    return hotelRepository.counts();
  },
};