import { cache } from "../cache";
import { auditRepository } from "../repositories/auditRepository";
import { airlineRepository } from "../repositories/airlineRepository";
import { AppError } from "../middleware/errorHandler";

export const airlineService = {
  async getAll(filters?: any) {
    const key = cache.airlineKey(JSON.stringify(filters || {}));
    const cached = await cache.get(key);
    if (cached) return cached;
    const result = await airlineRepository.findMany(filters);
    await cache.set(key, result, 300);
    return result;
  },

  async getById(id: string) {
    const airline = await airlineRepository.findById(id);
    if (!airline) throw new AppError("Airline not found", 404);
    return airline;
  },

  async create(data: any, adminId?: string) {
    const airline = await airlineRepository.create(data);
    await cache.invalidateAirlines();
    if (adminId) await auditRepository.log({ adminId, action: "created", entity: "airline", entityId: airline.id });
    return airline;
  },

  async update(id: string, data: any, adminId?: string) {
    const existing = await airlineRepository.findById(id);
    if (!existing) throw new AppError("Airline not found", 404);
    const airline = await airlineRepository.update(id, data);
    await cache.invalidateAirlines();
    if (adminId) await auditRepository.log({ adminId, action: "updated", entity: "airline", entityId: id });
    return airline;
  },

  async delete(id: string, adminId?: string) {
    const existing = await airlineRepository.findById(id);
    if (!existing) throw new AppError("Airline not found", 404);
    await airlineRepository.delete(id);
    await cache.invalidateAirlines();
    if (adminId) await auditRepository.log({ adminId, action: "deleted", entity: "airline", entityId: id });
    return { message: "Airline deleted successfully" };
  },
};