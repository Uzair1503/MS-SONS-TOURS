import { Response, NextFunction } from "express";
import { AuthRequest, PackageFilters } from "../types";
import { packageService } from "../services/packageService";

export const packageController = {
  async getAll(req: any, res: Response, next: NextFunction) {
    try {
      const filters: PackageFilters = {
        durationDays: req.query.durationDays ? parseInt(req.query.durationDays) : undefined,
        airlineId: req.query.airlineId,
        hotelId: req.query.hotelId,
        hotelRefId: req.query.hotelRefId,
        makkahHotelId: req.query.makkahHotelId,
        madinahHotelId: req.query.madinahHotelId,
        roomTypeId: req.query.roomTypeId,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        departureDate: req.query.departureDate,
        returnDate: req.query.returnDate,
        status: req.query.status,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      };
      const result = await packageService.getAll(filters);
      res.json({
        success: true,
        data: result.packages,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: any, res: Response, next: NextFunction) {
    try {
      const pkg = await packageService.getById(req.params.id);
      res.json({ success: true, data: pkg });
    } catch (err) {
      next(err);
    }
  },

  async getByDuration(req: any, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.params.days);
      const result = await packageService.getByDuration(days, {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
      });
      res.json({
        success: true,
        data: result.packages,
        pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (err) {
      next(err);
    }
  },

  async getFeatured(req: any, res: Response, next: NextFunction) {
    try {
      const days = parseInt(req.params.days);
      const packages = await packageService.getFeatured(days);
      res.json({ success: true, data: packages });
    } catch (err) {
      next(err);
    }
  },

  async calculate(req: any, res: Response, next: NextFunction) {
    try {
      const { packageId, roomTypeId, adults, children, infants } = req.body;
      const result = await packageService.calculatePrice(
        packageId, roomTypeId,
        adults || 1, children || 0, infants || 0
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pkg = await packageService.create(req.body, req.admin?.id);
      res.status(201).json({ success: true, data: pkg });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pkg = await packageService.update(req.params.id, req.body, req.admin?.id);
      res.json({ success: true, data: pkg });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await packageService.delete(req.params.id, req.admin?.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async counts(req: any, res: Response, next: NextFunction) {
    try {
      const result = await packageService.counts();
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};