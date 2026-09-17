import { auditRepository } from "../repositories/auditRepository";
import { reviewRepository } from "../repositories/reviewRepository";
import { AppError } from "../middleware/errorHandler";

export const reviewService = {
  async getAll(filters?: { page?: number; limit?: number }) {
    return reviewRepository.findAll(filters);
  },

  async create(data: any) {
    return reviewRepository.create(data);
  },

  async toggleApproval(id: string, adminId?: string) {
    const existing = await reviewRepository.findById(id);
    if (!existing) throw new AppError("Review not found", 404);
    const review = await reviewRepository.setApproval(id, !existing.isApproved);
    if (adminId) {
      await auditRepository.log({
        adminId,
        action: "toggled",
        entity: "review",
        entityId: id,
        metadata: { isApproved: review.isApproved },
      });
    }
    return review;
  },

  async delete(id: string, adminId?: string) {
    const existing = await reviewRepository.findById(id);
    if (!existing) throw new AppError("Review not found", 404);
    await reviewRepository.delete(id);
    if (adminId) {
      await auditRepository.log({
        adminId,
        action: "deleted",
        entity: "review",
        entityId: id,
      });
    }
    return { message: "Review deleted successfully" };
  },
};