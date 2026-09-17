import { cache } from "../cache";
import { auditRepository } from "../repositories/auditRepository";
import { roomTypeRepository } from "../repositories/roomTypeRepository";
import { AppError } from "../middleware/errorHandler";

export const roomTypeService = {
  async getAll() {
    const cached = await cache.get(cache.roomTypeKey());
    if (cached) return cached;
    const result = await roomTypeRepository.findMany();
    await cache.set(cache.roomTypeKey(), result, 300);
    return result;
  },

  async getById(id: string) {
    const rt = await roomTypeRepository.findById(id);
    if (!rt) throw new AppError("Room type not found", 404);
    return rt;
  },

  async create(data: any, adminId?: string) {
    const existing = await roomTypeRepository.findByName(data.name);
    if (existing) throw new AppError("Room type with this name already exists", 400);
    const rt = await roomTypeRepository.create(data);
    await cache.invalidateRoomTypes();
    if (adminId) await auditRepository.log({ adminId, action: "created", entity: "roomType", entityId: rt.id });
    return rt;
  },

  async update(id: string, data: any, adminId?: string) {
    const existing = await roomTypeRepository.findById(id);
    if (!existing) throw new AppError("Room type not found", 404);
    const rt = await roomTypeRepository.update(id, data);
    await cache.invalidateRoomTypes();
    if (adminId) await auditRepository.log({ adminId, action: "updated", entity: "roomType", entityId: id });
    return rt;
  },

  async delete(id: string, adminId?: string) {
    const existing = await roomTypeRepository.findById(id);
    if (!existing) throw new AppError("Room type not found", 404);
    await roomTypeRepository.delete(id);
    await cache.invalidateRoomTypes();
    await cache.invalidate("mssons:calc:*");
    await cache.invalidateHotels();
    await cache.invalidatePackages();
    if (adminId) await auditRepository.log({ adminId, action: "deleted", entity: "roomType", entityId: id });
    return { message: "Room type deleted successfully" };
  },
};