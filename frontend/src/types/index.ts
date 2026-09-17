export interface Airline {
  id: string;
  name: string;
  code: string;
  logo: string | null;
  description: string | null;
  baggageAllowance: string | null;
  departureCity: string;
  arrivalCity: string;
  active: boolean;
  _count?: { packages: number };
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  location: string | null;
  distanceFromHaram: string | null;
  distanceFromMasjidNabawi: string | null;
  category: string;
  rating: number | null;
  starRating: number | null;
  shuttleAvailable: boolean;
  description: string | null;
  amenities: string[];
  images: string[];
  active: boolean;
  roomPrices?: HotelRoomPrice[];
}

export interface HotelRoomPrice {
  id: string;
  hotelId: string;
  roomTypeId: string;
  roomType: RoomType;
  price: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UmrahSettings {
  validity: string;
  condition: string;
  groupPax: { min: number; max: number };
  currency: { from: string; to: string; sarToPkr: number };
  visa: { base: number; flightTiers: Record<string, number>; infant: number };
  ziarat: { makkah: number; madinah: number };
  terms: string[];
}

export interface CustomPackageInput {
  adults: number;
  children: number;
  infants: number;
  makkahHotelId?: string;
  makkahRoomTypeId?: string;
  makkahNights?: number;
  madinahHotelId?: string;
  madinahRoomTypeId?: string;
  madinahNights?: number;
  ziaratMakkah?: boolean;
  ziaratMadina?: boolean;
}

export interface CustomPackageItem {
  label: string;
  detail: string;
  amount: number;
}

export interface CustomPackageResult {
  adults: number;
  children: number;
  infants: number;
  seatPax: number;
  items: CustomPackageItem[];
  sarSubtotal: number;
  exchangeRate: number;
  pkrTotal: number;
  currency: { from: string; to: string };
  makkah?: { hotelName: string; roomTypeName: string; nights: number; rate: number };
  madinah?: { hotelName: string; roomTypeName: string; nights: number; rate: number };
}

export interface RoomType {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
}

export interface PackageHotel {
  id: string;
  hotelId: string;
  hotel: Hotel;
  distance: string | null;
  location: string | null;
  nights: number | null;
  shuttleAvailable: boolean;
}

export interface PackageRoomPrice {
  id: string;
  packageId: string;
  roomTypeId: string;
  roomType: RoomType;
  price: number;
  currency: string;
  available: boolean;
}

export interface Package {
  id: string;
  packageCode: string | null;
  title: string;
  durationDays: number;
  status: string;
  description: string | null;
  provider: string | null;
  airlineId: string | null;
  airline: Airline | null;
  departureCity: string;
  arrivalCity: string;
  departureDate: string | null;
  returnDate: string | null;
  departureDates: string | null;
  returnDates: string | null;
  baggageDetails: string | null;
  infantRate: number | null;
  childRate: number | null;
  childWithoutBedRate: number | null;
  visaIncluded: boolean;
  ticketIncluded: boolean;
  hotelIncluded: boolean;
  transportIncluded: boolean;
  guideIncluded: boolean;
  ziyaratIncluded: boolean;
  termsAndConditions: string | null;
  sortOrder: number;
  makkahHotel: PackageHotel | null;
  makkahHotelId: string | null;
  makkahNights: number | null;
  makkahDistance: string | null;
  madinahHotel: PackageHotel | null;
  madinahHotelId: string | null;
  madinahNights: number | null;
  madinahDistance: string | null;
  roomPrices: PackageRoomPrice[];
  createdAt: string;
}

export interface BookingInquiry {
  id: string;
  referenceNumber: string;
  fullName: string;
  whatsappNumber: string;
  email: string | null;
  adults: number;
  children: number;
  infants: number;
  durationDays: number | null;
  packageId: string | null;
  package?: Package;
  airlineId: string | null;
  hotelPreference: string | null;
  roomType: string | null;
  departureDate: string | null;
  specialRequirements: string | null;
  message: string | null;
  status: string;
  adminNotes: string | null;
  estimatedPrice: number | null;
  currency: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  packages: { total: number; active: number; days14: number; days21: number };
  hotels: { total: number; makkah: number; madinah: number };
  airlines: { total: number };
  roomTypes: { total: number };
  inquiries: { total: number; newCount: number; confirmed: number };
  recentInquiries: BookingInquiry[];
  recentAuditLogs: any[];
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

export interface FlightSchedule {
  id: string;
  airlineId: string;
  airline: Pick<Airline, "id" | "name" | "code"> & Airline;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  returnDate: string | null;
  flightNumber: string | null;
  baggageDetails: string | null;
  status: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF";
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  adminId: string | null;
  admin: { name: string; email: string } | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: any | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date?: string;
  location?: string;
  imageUrl?: string | null;
  isApproved?: boolean;
}
