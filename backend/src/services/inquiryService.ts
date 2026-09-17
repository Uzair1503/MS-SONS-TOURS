import { events } from "../events";
import { auditRepository } from "../repositories/auditRepository";
import { inquiryRepository } from "../repositories/inquiryRepository";
import { AppError } from "../middleware/errorHandler";
import { generateReferenceNumber } from "../utils/helpers";
import { sendBookingNotification } from "./emailService";

export const inquiryService = {
  async getAll(filters?: any) {
    return inquiryRepository.findMany(filters);
  },

  async getById(id: string) {
    const inquiry = await inquiryRepository.findById(id);
    if (!inquiry) throw new AppError("Inquiry not found", 404);
    return inquiry;
  },

  async create(data: any) {
    const referenceNumber = generateReferenceNumber();
    const inquiry = await inquiryRepository.create({
      ...data,
      referenceNumber,
      durationDays: data.durationDays ? parseInt(data.durationDays) : undefined,
    });
    await events.inquiryCreated(inquiry);
    try {
      await sendBookingNotification(inquiry);
    } catch (err) {
      console.error("Failed to send booking notification email", err);
    }
    return inquiry;
  },

  async update(id: string, data: any, adminId?: string) {
    const existing = await inquiryRepository.findById(id);
    if (!existing) throw new AppError("Inquiry not found", 404);

    const oldStatus = existing.status;
    const inquiry = await inquiryRepository.update(id, data);

    if (data.status && data.status !== oldStatus) {
      await events.bookingStatusChanged({ id, oldStatus, newStatus: data.status });
      if (adminId) {
        await auditRepository.log({
          adminId,
          action: "status_changed",
          entity: "inquiry",
          entityId: id,
          metadata: { oldStatus, newStatus: data.status },
        });
      }
    }

    await events.inquiryUpdated(inquiry);
    return inquiry;
  },

  async counts() {
    return inquiryRepository.counts();
  },
};