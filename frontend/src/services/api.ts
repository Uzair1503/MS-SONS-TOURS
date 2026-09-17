import axios from "axios";
import type { ApiResponse, Package, Hotel, Airline, RoomType, BookingInquiry, DashboardStats, CalculatorResult, AdminUser, AuditLogEntry, UmrahSettings, CustomPackageInput, CustomPackageResult, Review } from "@/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const pathname = window.location.pathname;
      if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// Public APIs
export const packageApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Package[]>>("/packages", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<Package>>(`/packages/${id}`),
  getByDuration: (days: number, params?: Record<string, string>) =>
    api.get<ApiResponse<Package[]>>(`/packages/duration/${days}`, { params }),
  getFeatured: (days: number) =>
    api.get<ApiResponse<Package[]>>(`/packages/featured/${days}`),
  getCounts: () =>
    api.get<ApiResponse<any>>("/packages/counts"),
  calculate: (data: { packageId: string; roomTypeId: string; adults: number; children: number; infants: number }) =>
    api.post<ApiResponse<CalculatorResult>>("/packages/calculate", data),
};

export const hotelApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Hotel[]>>("/hotels", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<Hotel>>(`/hotels/${id}`),
  getCounts: () =>
    api.get<ApiResponse<any>>("/hotels/counts"),
};

export const airlineApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<Airline[]>>("/airlines", { params }),
  getById: (id: string) =>
    api.get<ApiResponse<Airline>>(`/airlines/${id}`),
};

export const roomTypeApi = {
  getAll: () =>
    api.get<ApiResponse<RoomType[]>>("/room-types"),
};

export const inquiryApi = {
  create: (data: any) =>
    api.post<ApiResponse<BookingInquiry>>("/inquiries", data),
};

export const flightApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ApiResponse<any[]>>("/flights", { params }),
};

export const settingsApi = {
  getPublic: () =>
    api.get<ApiResponse<Record<string, string>>>("/settings/public"),
};

export const umrahApi = {
  getSettings: () =>
    api.get<ApiResponse<UmrahSettings>>("/umrah/settings"),
};

export const customPackageApi = {
  calculate: (data: CustomPackageInput) =>
    api.post<ApiResponse<CustomPackageResult>>("/custom-package/calculate", data),
};

// Reviews (public submission + display)
export const reviewApi = {
  getAll: () =>
    api.get<ApiResponse<Review[]>>("/reviews"),
  create: (data: { name: string; city?: string; rating: number; comment: string; image?: { name: string; data: string } }) =>
    api.post<ApiResponse<Review>>("/reviews", data),
  uploadImage: (name: string, data: string) =>
    api.post<ApiResponse<{ url: string }>>("/reviews/image", { name, data }),
};

// Admin APIs
export const adminApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: any }>>("/auth/login", { email, password }),
  logout: () =>
    api.post("/auth/logout"),
  getProfile: () =>
    api.get<ApiResponse<any>>("/auth/profile"),
  getDashboard: () =>
    api.get<ApiResponse<DashboardStats>>("/admin/dashboard"),

  // Package CRUD
  createPackage: (data: any) =>
    api.post<ApiResponse<Package>>("/packages", data),
  updatePackage: (id: string, data: any) =>
    api.put<ApiResponse<Package>>(`/packages/${id}`, data),
  deletePackage: (id: string) =>
    api.delete(`/packages/${id}`),

  // Hotel CRUD
  createHotel: (data: any) =>
    api.post<ApiResponse<Hotel>>("/hotels", data),
  updateHotel: (id: string, data: any) =>
    api.put<ApiResponse<Hotel>>(`/hotels/${id}`, data),
  deleteHotel: (id: string) =>
    api.delete(`/hotels/${id}`),

  // Airline CRUD
  createAirline: (data: any) =>
    api.post<ApiResponse<Airline>>("/airlines", data),
  updateAirline: (id: string, data: any) =>
    api.put<ApiResponse<Airline>>(`/airlines/${id}`, data),
  deleteAirline: (id: string) =>
    api.delete(`/airlines/${id}`),

  // Room Type CRUD
  createRoomType: (data: any) =>
    api.post<ApiResponse<RoomType>>("/room-types", data),
  updateRoomType: (id: string, data: any) =>
    api.put<ApiResponse<RoomType>>(`/room-types/${id}`, data),
  deleteRoomType: (id: string) =>
    api.delete(`/room-types/${id}`),

  // Inquiry management
  getInquiries: (params?: Record<string, string>) =>
    api.get<ApiResponse<BookingInquiry[]>>("/inquiries", { params }),
  getInquiry: (id: string) =>
    api.get<ApiResponse<BookingInquiry>>(`/inquiries/${id}`),
  updateInquiry: (id: string, data: any) =>
    api.put<ApiResponse<BookingInquiry>>(`/inquiries/${id}`, data),
  getInquiryCounts: () =>
    api.get<ApiResponse<any>>("/inquiries/counts"),

  // Settings
  getSettings: () =>
    api.get<ApiResponse<any>>("/settings"),
  setSetting: (key: string, value: string, category?: string) =>
    api.post("/settings", { key, value, category }),
  setSettingsBulk: (settings: { key: string; value: string; category?: string }[]) =>
    api.post("/settings/bulk", { settings }),

  // Flight schedules
  getFlights: (params?: Record<string, string>) =>
    api.get<ApiResponse<any[]>>("/flights", { params }),
  createFlight: (data: any) =>
    api.post<ApiResponse<any>>("/flights", data),
  updateFlight: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/flights/${id}`, data),
  deleteFlight: (id: string) =>
    api.delete(`/flights/${id}`),

  // Staff / admin users
  getUsers: (params?: Record<string, string>) =>
    api.get<ApiResponse<AdminUser[]>>("/admin/users", { params }),
  createUser: (data: any) =>
    api.post<ApiResponse<AdminUser>>("/admin/users", data),
  updateUser: (id: string, data: any) =>
    api.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),

  // Audit logs
  getAuditLogs: (params?: Record<string, string>) =>
    api.get<ApiResponse<AuditLogEntry[]>>("/admin/audit-logs", { params }),

  // Review moderation
  getReviews: (params?: Record<string, string>) =>
    api.get<ApiResponse<Review[]>>("/admin/reviews", { params }),
  toggleReviewApproval: (id: string) =>
    api.patch<ApiResponse<Review>>(`/admin/reviews/${id}`),
  deleteReview: (id: string) =>
    api.delete(`/admin/reviews/${id}`),

  // Image uploads
  uploadHotelImage: (name: string, data: string) =>
    api.post<ApiResponse<{ url: string }>>("/admin/uploads/hotel-image", { name, data }),

  // Umrah rates & settings
  getUmrahSettings: () =>
    api.get<ApiResponse<UmrahSettings>>("/admin/umrah/settings"),
  updateUmrahSettings: (data: any) =>
    api.put<ApiResponse<UmrahSettings>>("/admin/umrah/settings", data),
};

export default api;
