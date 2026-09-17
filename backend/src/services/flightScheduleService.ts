import { flightScheduleRepository } from "../repositories/flightScheduleRepository";
import { auditRepository } from "../repositories/auditRepository";

export const flightScheduleService = {
  async getAll(filters?: any) {
    return flightScheduleRepository.findMany(filters);
  },

  async create(data: any, adminId?: string) {
    const flightData = {
      ...data,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
    };
    const flight = await flightScheduleRepository.create(flightData);
    if (adminId) await auditRepository.log({ adminId, action: "created", entity: "flightSchedule", entityId: flight.id });
    return flight;
  },

  async update(id: string, data: any, adminId?: string) {
    const updateData: any = { ...data };
    if (data.departureDate) updateData.departureDate = new Date(data.departureDate);
    if (data.returnDate) updateData.returnDate = new Date(data.returnDate);
    const flight = await flightScheduleRepository.update(id, updateData);
    if (adminId) await auditRepository.log({ adminId, action: "updated", entity: "flightSchedule", entityId: id });
    return flight;
  },

  async delete(id: string, adminId?: string) {
    await flightScheduleRepository.delete(id);
    if (adminId) await auditRepository.log({ adminId, action: "deleted", entity: "flightSchedule", entityId: id });
    return { message: "Flight schedule deleted successfully" };
  },
};