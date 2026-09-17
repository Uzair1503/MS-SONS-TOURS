import { publishEvent } from "../config/kafka";

export const events = {
  async packageCreated(pkg: { id: string; title: string; packageCode?: string | null }) {
    await publishEvent("package.created", { entity: "package", action: "created", data: pkg });
  },

  async packageUpdated(pkg: { id: string; title: string }) {
    await publishEvent("package.updated", { entity: "package", action: "updated", data: pkg });
  },

  async packageDeleted(data: { id: string }) {
    await publishEvent("package.deleted", { entity: "package", action: "deleted", data });
  },

  async inquiryCreated(inquiry: { id: string; referenceNumber: string; fullName: string }) {
    await publishEvent("inquiry.created", { entity: "inquiry", action: "created", data: inquiry });
  },

  async inquiryUpdated(inquiry: { id: string; status: string }) {
    await publishEvent("inquiry.updated", { entity: "inquiry", action: "updated", data: inquiry });
  },

  async bookingStatusChanged(data: { id: string; oldStatus: string; newStatus: string }) {
    await publishEvent("booking.status.changed", { entity: "inquiry", action: "status_changed", data });
  },

  async adminActionLogged(log: { adminId: string; action: string; entity: string; entityId?: string }) {
    await publishEvent("admin.action.logged", { entity: "audit", action: "logged", data: log });
  },
};