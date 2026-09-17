import { auditRepository } from "../repositories/auditRepository";

export const auditService = {
  async getAll(filters?: { entity?: string; adminId?: string; page?: number; limit?: number }) {
    return auditRepository.findMany(filters);
  },
};