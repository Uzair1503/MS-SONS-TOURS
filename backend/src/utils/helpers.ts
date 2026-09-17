export function generateReferenceNumber(): string {
  const prefix = "MST";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function formatPrice(amount: number, currency: string = "PKR"): string {
  return `${currency} ${amount.toLocaleString("en-PK")}`;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encoded}`;
}

export function generateWhatsAppMessage(data: {
  packageName?: string;
  duration?: number;
  airline?: string;
  hotel?: string;
  room?: string;
  persons?: number;
  estimatedTotal?: number;
}): string {
  let msg = "Assalam o Alaikum, I am interested in an Umrah package from MS Sons Tours.\n\n";
  if (data.packageName) msg += `Package: ${data.packageName}\n`;
  if (data.duration) msg += `Duration: ${data.duration} Days\n`;
  if (data.airline) msg += `Airline: ${data.airline}\n`;
  if (data.hotel) msg += `Hotel: ${data.hotel}\n`;
  if (data.room) msg += `Room: ${data.room}\n`;
  if (data.persons) msg += `Persons: ${data.persons}\n`;
  if (data.estimatedTotal) msg += `Estimated Total: PKR ${data.estimatedTotal.toLocaleString("en-PK")}\n`;
  msg += "\nPlease provide booking details.";
  return msg;
}