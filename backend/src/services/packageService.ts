import { prisma } from "../config/prisma";
import { cache } from "../cache";
import { events } from "../events";
import { auditRepository } from "../repositories/auditRepository";
import { AppError } from "../middleware/errorHandler";
import { PackageFilters } from "../types";
import { packageRepository } from "../repositories/packageRepository";

// Admin package forms submit a Hotel id for makkahHotelId/madinahHotelId,
// while Package.makkahHotelId/madinahHotelId reference PackageHotel ids.
// Resolve a Hotel id to its (single) PackageHotel id, creating it if needed.
async function resolvePackageHotel(hotelId?: string | null): Promise<string | null | undefined> {
  if (!hotelId) return hotelId;
  const existingHotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!existingHotel) return hotelId;
  const existing = await prisma.packageHotel.findUnique({ where: { hotelId } });
  if (existing) return existing.id;
  const ph = await prisma.packageHotel.create({ data: { hotelId } });
  return ph.id;
}

export const packageService = {
  async getAll(filters: PackageFilters) {
    const filterKey = JSON.stringify(filters);
    const cached = await cache.get(cache.packageKey(filterKey));
    if (cached) return cached;

    const result = await packageRepository.findMany(filters);
    await cache.set(cache.packageKey(filterKey), result, 180);
    return result;
  },

  async getById(id: string) {
    const cached = await cache.get(cache.packageDetailKey(id));
    if (cached) return cached;

    const pkg = await packageRepository.findById(id);
    if (!pkg) throw new AppError("Package not found", 404);
    await cache.set(cache.packageDetailKey(id), pkg, 180);
    return pkg;
  },

  async getByDuration(days: number, filters?: PackageFilters) {
    const key = cache.packageKey(`duration:${days}:${JSON.stringify(filters || {})}`);
    const cached = await cache.get(key);
    if (cached) return cached;

    const result = await packageRepository.findByDuration(days, filters);
    await cache.set(key, result, 180);
    return result;
  },

  async getFeatured(days: number) {
    const cached = await cache.get(cache.featuredKey(days));
    if (cached) return cached;

    const result = await packageRepository.findFeatured(days);
    await cache.set(cache.featuredKey(days), result, 180);
    return result;
  },

  async create(data: any, adminId?: string) {
    const { roomPrices, ...packageData } = data;

    if (packageData.departureDate) packageData.departureDate = new Date(packageData.departureDate);
    if (packageData.returnDate) packageData.returnDate = new Date(packageData.returnDate);
    packageData.makkahHotelId = await resolvePackageHotel(packageData.makkahHotelId);
    packageData.madinahHotelId = await resolvePackageHotel(packageData.madinahHotelId);

    const seen = new Set<string>();
    const prices = Array.isArray(roomPrices)
      ? roomPrices
          .filter((rp: any) => rp.roomTypeId && rp.price)
          .map((rp: any) => ({
            roomTypeId: rp.roomTypeId,
            price: Number(rp.price) || 0,
            available: rp.available ?? true,
          }))
          .filter((rp: any) => {
            if (seen.has(rp.roomTypeId)) return false;
            seen.add(rp.roomTypeId);
            return true;
          })
      : [];

    const pkg = await prisma.package.create({
      data: {
        ...packageData,
        ...(prices.length
          ? {
              roomPrices: {
                create: prices,
              },
            }
          : {}),
      },
      include: {
        airline: true,
        roomPrices: { include: { roomType: true } },
        makkahHotel: { include: { hotel: true } },
        madinahHotel: { include: { hotel: true } },
      },
    });

    await cache.invalidatePackages();
    await events.packageCreated(pkg);
    if (adminId) {
      await auditRepository.log({ adminId, action: "created", entity: "package", entityId: pkg.id });
    }
    return pkg;
  },

  async update(id: string, data: any, adminId?: string) {
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) throw new AppError("Package not found", 404);

    const { roomPrices, ...packageData } = data;

    if (packageData.departureDate) packageData.departureDate = new Date(packageData.departureDate);
    if (packageData.returnDate) packageData.returnDate = new Date(packageData.returnDate);
    packageData.makkahHotelId = await resolvePackageHotel(packageData.makkahHotelId);
    packageData.madinahHotelId = await resolvePackageHotel(packageData.madinahHotelId);

    // Normalize + dedupe room prices so removed rows are truly deleted
    // and duplicate room types can never be re-created.
    const seen = new Set<string>();
    const prices = Array.isArray(roomPrices)
      ? roomPrices
          .filter((rp: any) => rp.roomTypeId)
          .map((rp: any) => ({
            roomTypeId: rp.roomTypeId,
            price: Number(rp.price) || 0,
            available: rp.available ?? true,
          }))
          .filter((rp: any) => {
            if (seen.has(rp.roomTypeId)) return false;
            seen.add(rp.roomTypeId);
            return true;
          })
      : undefined;

    await prisma.$transaction(async (tx) => {
      if (prices) {
        await tx.packageRoomPrice.deleteMany({
          where: { packageId: id, roomTypeId: { notIn: prices.map((rp) => rp.roomTypeId) } },
        });
      }

      await tx.package.update({ where: { id }, data: packageData });

      if (prices) {
        for (const rp of prices) {
          await tx.packageRoomPrice.upsert({
            where: { packageId_roomTypeId: { packageId: id, roomTypeId: rp.roomTypeId } },
            update: { price: rp.price, available: rp.available },
            create: { packageId: id, roomTypeId: rp.roomTypeId, price: rp.price, available: rp.available },
          });
        }
      }
    });

    const updated = await packageRepository.findById(id);
    await cache.invalidatePackages();
    await events.packageUpdated(updated || existing);
    if (adminId) {
      await auditRepository.log({ adminId, action: "updated", entity: "package", entityId: id, metadata: { title: (updated || existing).title } });
    }
    return updated;
  },

  async delete(id: string, adminId?: string) {
    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) throw new AppError("Package not found", 404);

    await prisma.package.delete({ where: { id } });
    await cache.invalidatePackages();
    await events.packageDeleted({ id });
    if (adminId) {
      await auditRepository.log({ adminId, action: "deleted", entity: "package", entityId: id });
    }
    return { message: "Package deleted successfully" };
  },

  async counts() {
    return packageRepository.counts();
  },

  async calculatePrice(packageId: string, roomTypeId: string, adults: number, children: number, infants: number) {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        airline: true,
        roomPrices: { include: { roomType: true } },
        makkahHotel: { include: { hotel: true } },
        madinahHotel: { include: { hotel: true } },
      },
    });
    if (!pkg) throw new AppError("Package not found", 404);

    const roomPrice = pkg.roomPrices.find((rp) => rp.roomTypeId === roomTypeId);
    if (!roomPrice) throw new AppError("Room type not available for this package", 400);

    const adultTotal = adults * roomPrice.price;
    const childTotal = children * (pkg.childRate || roomPrice.price * 0.75);
    const infantTotal = infants * (pkg.infantRate || 0);
    const grandTotal = adultTotal + childTotal + infantTotal;

    return {
      packageId: pkg.id,
      packageTitle: pkg.title,
      packageCode: pkg.packageCode,
      durationDays: pkg.durationDays,
      airline: pkg.airline?.name || null,
      makkahHotel: pkg.makkahHotel?.hotel?.name || null,
      madinahHotel: pkg.madinahHotel?.hotel?.name || null,
      roomType: roomPrice.roomType.name,
      pricePerPerson: roomPrice.price,
      adults,
      children,
      infants,
      adultTotal,
      childTotal,
      infantTotal,
      grandTotal,
      currency: roomPrice.currency,
      includedServices: {
        visa: pkg.visaIncluded,
        ticket: pkg.ticketIncluded,
        hotel: pkg.hotelIncluded,
        transport: pkg.transportIncluded,
        guide: pkg.guideIncluded,
        ziyarat: pkg.ziyaratIncluded,
      },
      flightInfo: {
        departureCity: pkg.departureCity,
        arrivalCity: pkg.arrivalCity,
        departureDate: pkg.departureDate?.toISOString() || null,
        returnDate: pkg.returnDate?.toISOString() || null,
        baggage: pkg.baggageDetails,
      },
    };
  },
};