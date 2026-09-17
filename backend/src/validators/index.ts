import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const packageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  packageCode: z.string().optional().nullable(),
  durationDays: z.number().int().min(1).max(60),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT", "SOLD_OUT"]).optional(),
  description: z.string().optional().nullable(),
  provider: z.string().optional().nullable(),
  airlineId: z.string().optional().nullable(),
  departureCity: z.string().optional(),
  arrivalCity: z.string().optional(),
  departureDate: z.string().optional().nullable(),
  returnDate: z.string().optional().nullable(),
  baggageDetails: z.string().optional().nullable(),
  infantRate: z.number().optional().nullable(),
  childRate: z.number().optional().nullable(),
  childWithoutBedRate: z.number().optional().nullable(),
  visaIncluded: z.boolean().optional(),
  ticketIncluded: z.boolean().optional(),
  hotelIncluded: z.boolean().optional(),
  transportIncluded: z.boolean().optional(),
  guideIncluded: z.boolean().optional(),
  ziyaratIncluded: z.boolean().optional(),
  termsAndConditions: z.string().optional().nullable(),
  sortOrder: z.number().optional(),
  makkahHotelId: z.string().optional().nullable(),
  makkahNights: z.number().int().optional().nullable(),
  makkahDistance: z.string().optional().nullable(),
  madinahHotelId: z.string().optional().nullable(),
  madinahNights: z.number().int().optional().nullable(),
  madinahDistance: z.string().optional().nullable(),
  roomPrices: z
    .array(
      z.object({
        roomTypeId: z.string(),
        price: z.number().min(0),
        available: z.boolean().optional(),
      })
    )
    .optional(),
});

export const hotelSchema = z.object({
  name: z.string().min(1, "Hotel name is required"),
  city: z.string().min(1, "City is required"),
  location: z.string().optional().nullable(),
  distanceFromHaram: z.string().optional().nullable(),
  distanceFromMasjidNabawi: z.string().optional().nullable(),
  category: z.enum(["BUDGET", "ECONOMY", "STANDARD", "PREMIUM", "LUXURY"]).optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  starRating: z.number().int().min(1).max(5).optional().nullable(),
  shuttleAvailable: z.boolean().optional(),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export const airlineSchema = z.object({
  name: z.string().min(1, "Airline name is required"),
  code: z.string().min(1, "Airline code is required"),
  logo: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  baggageAllowance: z.string().optional().nullable(),
  departureCity: z.string().optional(),
  arrivalCity: z.string().optional(),
  active: z.boolean().optional(),
});

export const roomTypeSchema = z.object({
  name: z.string().min(1, "Room type name is required"),
  code: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const inquirySchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  email: z.string().email().optional().nullable(),
  adults: z.number().int().min(1).max(50).optional(),
  children: z.number().int().min(0).max(20).optional(),
  infants: z.number().int().min(0).max(10).optional(),
  durationDays: z.number().int().optional().nullable(),
  packageId: z.string().optional().nullable(),
  airlineId: z.string().optional().nullable(),
  hotelPreference: z.string().optional().nullable(),
  roomType: z.string().optional().nullable(),
  departureDate: z.string().optional().nullable(),
  specialRequirements: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
});

export const flightScheduleSchema = z.object({
  airlineId: z.string().min(1, "Airline is required"),
  departureCity: z.string().optional(),
  arrivalCity: z.string().optional(),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  baggageDetails: z.string().optional().nullable(),
  status: z.string().optional(),
});

export const adminUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  active: z.boolean().optional(),
});

export const reviewSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  city: z.string().max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(2000),
  image: z
    .object({
      name: z.string().min(1),
      data: z.string().min(1),
    })
    .optional(),
});