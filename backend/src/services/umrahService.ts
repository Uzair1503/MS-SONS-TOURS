import { cache } from "../cache";
import { prisma } from "../config/prisma";
import { auditRepository } from "../repositories/auditRepository";
import { settingService } from "./settingService";
import { AppError } from "../middleware/errorHandler";

export const UMRAH_SETTING_KEYS = [
  "umrah_validity",
  "umrah_condition",
  "group_pax_min",
  "group_pax_max",
  "currency_sar_to_pkr",
  "visa_base_rate",
  "flight_rate_1pax",
  "flight_rate_2pax",
  "flight_rate_3pax",
  "flight_rate_4pax",
  "infant_visa_rate",
  "ziarat_makkah",
  "ziarat_madina",
  "umrah_terms",
];

const DEFAULT_UMRAH_TERMS = [
  "1. All rates are in Saudi Arabia Riyals (SAR).",
  "2. Visa Riyal rate charge at passport submission & voucher rate at voucher making date. Booking will start after 100% full payment.",
  "3. All packages are non-refundable & non-changeable.",
  "4. Overstay fine: 25,000 SAR per person.",
  "5. Any additional tax imposed by Pakistan or KSA Govt will be charged.",
  "6. All send to Embassy cases will charge as per market rate.",
  "7. Package will change any time without prior notice. Hotel Voucher are not linked with visa issuance date.",
];

const DEFAULTS: Record<string, string> = {
  umrah_validity: "2026-09-30",
  umrah_condition: "Visa Ticket must be with Direct Airline.",
  group_pax_min: "1",
  group_pax_max: "49",
  currency_sar_to_pkr: "75",
  visa_base_rate: "580",
  flight_rate_1pax: "705",
  flight_rate_2pax: "680",
  flight_rate_3pax: "655",
  flight_rate_4pax: "630",
  infant_visa_rate: "465",
  ziarat_makkah: "12",
  ziarat_madina: "12",
};

function num(value: string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export type UmrahSettings = {
  validity: string;
  condition: string;
  groupPax: { min: number; max: number };
  currency: { from: string; to: string; sarToPkr: number };
  visa: {
    base: number;
    flightTiers: Record<string, number>;
    infant: number;
  };
  ziarat: { makkah: number; madinah: number };
  terms: string[];
};

async function readSettings(): Promise<UmrahSettings> {
  const map = await settingService.getAll();

  const termsRaw = map.umrah_terms || JSON.stringify(DEFAULT_UMRAH_TERMS);
  let terms: string[] = [];
  try {
    const parsed = JSON.parse(termsRaw);
    if (Array.isArray(parsed)) terms = parsed.map((t) => String(t));
  } catch {
    terms = [...DEFAULT_UMRAH_TERMS];
  }

  const max = Math.max(num(map.group_pax_max, 49), 1);

  return {
    validity: map.umrah_validity || DEFAULTS.umrah_validity,
    condition: map.umrah_condition || DEFAULTS.umrah_condition,
    groupPax: {
      min: Math.min(num(map.group_pax_min, 1), max),
      max,
    },
    currency: {
      from: "SAR",
      to: "PKR",
      sarToPkr: num(map.currency_sar_to_pkr, 75),
    },
    visa: {
      base: num(map.visa_base_rate, 580),
      flightTiers: {
        1: num(map.flight_rate_1pax, 705),
        2: num(map.flight_rate_2pax, 680),
        3: num(map.flight_rate_3pax, 655),
        4: num(map.flight_rate_4pax, 630),
      },
      infant: num(map.infant_visa_rate, 465),
    },
    ziarat: {
      makkah: num(map.ziarat_makkah, 12),
      madinah: num(map.ziarat_madina, 12),
    },
    terms,
  };
}

function flightRateForGroup(settings: UmrahSettings, seatPax: number): number {
  if (seatPax <= 0) return 0;
  if (seatPax <= 1) return settings.visa.flightTiers[1];
  if (seatPax === 2) return settings.visa.flightTiers[2];
  if (seatPax === 3) return settings.visa.flightTiers[3];
  return settings.visa.flightTiers[4];
}

function hotelPersons(adults: number, children: number): number {
  return adults + children;
}

export const umrahService = {
  UMRAH_SETTING_KEYS,
  DEFAULTS,
  DEFAULT_UMRAH_TERMS,

  async getSettings(fresh = false): Promise<UmrahSettings> {
    if (!fresh) {
      const cached = await cache.get<UmrahSettings>(cache.umrahKey());
      if (cached) return cached;
    }
    const settings = await readSettings();
    if (!fresh) await cache.set(cache.umrahKey(), settings, 300);
    return settings;
  },

  flightRateForGroup,

  hotelPersons,

  async update(body: any, adminId?: string) {
    const validity = typeof body.validity === "string" ? body.validity.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(validity) || Number.isNaN(new Date(validity + "T00:00:00Z").getTime())) {
      throw new AppError("Validity must be a valid date (YYYY-MM-DD)", 400);
    }

    const asNumber = (v: any, field: string): number => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw new AppError(`${field} must be a non-negative number`, 400);
      return n;
    };

    const groupPaxMin = Math.floor(asNumber(body.groupPaxMin, "Group pax minimum"));
    const groupPaxMax = Math.floor(asNumber(body.groupPaxMax, "Group pax maximum"));
    if (groupPaxMin < 1 || groupPaxMax < groupPaxMin) {
      throw new AppError("Group pax minimum must be at least 1 and not greater than the maximum", 400);
    }

    const sarToPkr = asNumber(body.sarToPkr, "SAR to PKR exchange rate");
    if (sarToPkr <= 0) throw new AppError("SAR to PKR exchange rate must be greater than 0", 400);

    const visaBase = asNumber(body.visaBase, "Visa base rate");
    const flightTiers = body.flightTiers || {};
    const tiers: Record<string, number> = {};
    for (const key of ["1", "2", "3", "4"]) {
      tiers[key] = asNumber(flightTiers[key], `Flight rate (${key} pax)`);
    }
    const infantVisa = asNumber(body.infantVisa, "Infant visa rate");
    const ziaratMakkah = asNumber(body.ziaratMakkah, "Makkah ziarat rate");
    const ziaratMadina = asNumber(body.ziaratMadina, "Madina ziarat rate");

    if (!Array.isArray(body.terms) || body.terms.some((t: any) => typeof t !== "string")) {
      throw new AppError("Terms must be an array of strings", 400);
    }
    const terms = body.terms.map((t: string) => t.trim()).filter(Boolean);

    const settings: Array<{ key: string; value: string; category: string }> = [
      { key: "umrah_validity", value: validity, category: "umrah" },
      { key: "umrah_condition", value: String(body.condition || "").trim(), category: "umrah" },
      { key: "group_pax_min", value: String(groupPaxMin), category: "umrah" },
      { key: "group_pax_max", value: String(groupPaxMax), category: "umrah" },
      { key: "currency_sar_to_pkr", value: String(sarToPkr), category: "umrah" },
      { key: "visa_base_rate", value: String(visaBase), category: "umrah" },
      { key: "flight_rate_1pax", value: String(tiers[1]), category: "umrah" },
      { key: "flight_rate_2pax", value: String(tiers[2]), category: "umrah" },
      { key: "flight_rate_3pax", value: String(tiers[3]), category: "umrah" },
      { key: "flight_rate_4pax", value: String(tiers[4]), category: "umrah" },
      { key: "infant_visa_rate", value: String(infantVisa), category: "umrah" },
      { key: "ziarat_makkah", value: String(ziaratMakkah), category: "umrah" },
      { key: "ziarat_madina", value: String(ziaratMadina), category: "umrah" },
      { key: "umrah_terms", value: JSON.stringify(terms), category: "umrah" },
    ];

    for (const s of settings) {
      await settingService.set(s.key, s.value, s.category);
    }

    await cache.invalidateUmrah();

    if (adminId) {
      await auditRepository.log({
        adminId,
        action: "updated",
        entity: "umrahSettings",
        metadata: {
          validity,
          sarToPkr,
          visaBase,
          infantVisa,
          ziaratMakkah,
          ziaratMadina,
          groupPax: `${groupPaxMin}-${groupPaxMax}`,
        },
      });
    }

    return this.getSettings(true);
  },

  // Hotel room price lookup for a hotel + room type (active/available only).
  async findHotelRoomPrice(hotelId: string, roomTypeId: string) {
    return prisma.hotelRoomPrice.findFirst({
      where: { hotelId, roomTypeId, available: true },
      include: { roomType: true },
    });
  },
};