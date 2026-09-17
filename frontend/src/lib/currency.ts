// Centralized currency + occupancy helpers for the Umrah rate system.
// Single source of truth so conversion is never duplicated across components.
// The live SAR→PKR rate always comes from the backend/database (UmrahSettings).

export function convertSARtoPKR(amountSAR: number, rate: number): number {
  return Math.round(amountSAR * rate);
}

export function convertPaxPricing(
  sarTotal: number,
  settings: { currency: { sarToPkr: number } }
): number {
  return convertSARtoPKR(sarTotal, settings.currency.sarToPkr);
}

export function formatSAR(amount: number): string {
  return `SAR ${amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

// Occupancy model used to show how many rooms a group needs for a room type.
// Prices stay per-person-per-night; this only drives the "rooms required"
// display and group allocation (e.g. 7 adults in a Quad => 2 rooms).
const OCCUPANCY_MAP: Record<string, number> = {
  Sharing: 5,
  Quint: 5,
  Quad: 4,
  Triple: 3,
  Double: 2,
  Room: 2,
};

export function roomOccupancy(roomTypeName: string): number {
  return OCCUPANCY_MAP[roomTypeName] || 2;
}

export function roomsRequiredFor(seatPax: number, roomTypeName: string): number {
  const occupancy = roomOccupancy(roomTypeName);
  if (occupancy <= 0) return seatPax;
  return Math.ceil(seatPax / occupancy);
}

// Flight tier applies by seat-passenger group size (adults + children):
// 1 pax => tier 1, 2 => tier 2, 3 => tier 3, 4+ => tier 4.
export function flightRateForGroup(
  settings: { visa: { flightTiers: Record<string, number> } },
  seatPax: number
): number {
  const tiers = settings.visa.flightTiers || {};
  if (seatPax <= 0) return 0;
  if (seatPax <= 1) return tiers[1] ?? 0;
  if (seatPax === 2) return tiers[2] ?? 0;
  if (seatPax === 3) return tiers[3] ?? 0;
  return tiers[4] ?? 0;
}