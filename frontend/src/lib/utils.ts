import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = "PKR"): string {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encoded}`;
}

export function generateWhatsAppMessage(data: {
  packageCode?: string | null;
  packageName?: string;
  duration?: number;
  airline?: string;
  hotel?: string;
  hotelMakkah?: string;
  hotelMadinah?: string;
  room?: string;
  persons?: number;
  adults?: number;
  children?: number;
  infants?: number;
  estimatedTotal?: number;
  currency?: string;
}): string {
  let msg = "Assalam o Alaikum, I am interested in an Umrah package from MS Sons Tours.\n\n";
  if (data.packageName && data.packageCode) msg += `Package: ${data.packageName} (${data.packageCode})\n`;
  else if (data.packageName) msg += `Package: ${data.packageName}\n`;
  else if (data.packageCode) msg += `Package: ${data.packageCode}\n`;
  if (data.duration) msg += `Duration: ${data.duration} Days\n`;
  if (data.airline) msg += `Airline: ${data.airline}\n`;
  if (data.hotelMakkah) msg += `Makkah Hotel: ${data.hotelMakkah}\n`;
  if (data.hotelMadinah) msg += `Madinah Hotel: ${data.hotelMadinah}\n`;
  if (!data.hotelMakkah && !data.hotelMadinah && data.hotel) msg += `Hotel: ${data.hotel}\n`;
  if (data.room) msg += `Room Type: ${data.room}\n`;
  if (data.adults !== undefined) {
    msg += `Adults: ${data.adults} | Children: ${data.children ?? 0} | Infants: ${data.infants ?? 0}\n`;
  } else if (data.persons) {
    msg += `Persons: ${data.persons}\n`;
  }
  if (data.estimatedTotal !== undefined) {
    const currency = data.currency || "PKR";
    msg += `Estimated Total: ${currency} ${data.estimatedTotal.toLocaleString("en-PK")}\n`;
  }
  msg += "\nPlease provide booking details.";
  return msg;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseDateList(list?: string | null): string[] {
  if (!list) return [];
  return list
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE": return "bg-green-100 text-green-800";
    case "INACTIVE": return "bg-gray-100 text-gray-800";
    case "DRAFT": return "bg-yellow-100 text-yellow-800";
    case "SOLD_OUT": return "bg-red-100 text-red-800";
    case "NEW": return "bg-blue-100 text-blue-800";
    case "CONTACTED": return "bg-purple-100 text-purple-800";
    case "QUOTED": return "bg-indigo-100 text-indigo-800";
    case "CONFIRMED": return "bg-green-100 text-green-800";
    case "CANCELLED": return "bg-red-100 text-red-800";
    case "COMPLETED": return "bg-emerald-100 text-emerald-800";
    default: return "bg-gray-100 text-gray-800";
  }
}
