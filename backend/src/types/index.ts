import { Request } from "express";

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PackageFilters {
  durationDays?: number;
  airlineId?: string;
  hotelId?: string;
  hotelRefId?: string;
  makkahHotelId?: string;
  madinahHotelId?: string;
  roomTypeId?: string;
  minPrice?: number;
  maxPrice?: number;
  departureDate?: string;
  returnDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CalculatorInput {
  packageId: string;
  roomTypeId: string;
  adults: number;
  children: number;
  infants: number;
}

export interface CalculatorResult {
  packageId: string;
  packageTitle: string;
  packageCode: string | null;
  durationDays: number;
  airline: string | null;
  makkahHotel: string | null;
  madinahHotel: string | null;
  roomType: string;
  pricePerPerson: number;
  adults: number;
  children: number;
  infants: number;
  adultTotal: number;
  childTotal: number;
  infantTotal: number;
  grandTotal: number;
  currency: string;
  includedServices: {
    visa: boolean;
    ticket: boolean;
    hotel: boolean;
    transport: boolean;
    guide: boolean;
    ziyarat: boolean;
  };
  flightInfo: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string | null;
    returnDate: string | null;
    baggage: string | null;
  };
}