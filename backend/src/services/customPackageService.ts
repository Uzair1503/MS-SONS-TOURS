import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { umrahService } from "./umrahService";

export type CustomPackageInput = {
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
};

export type CustomPackageItem = {
  label: string;
  detail: string;
  amount: number;
};

export type CustomPackageResult = {
  adults: number;
  children: number;
  infants: number;
  seatPax: number;
  items: CustomPackageItem[];
  sarSubtotal: number;
  exchangeRate: number;
  pkrTotal: number;
  currency: { from: string; to: string };
  makkah?: {
    hotelName: string;
    roomTypeName: string;
    nights: number;
    rate: number;
  };
  madinah?: {
    hotelName: string;
    roomTypeName: string;
    nights: number;
    rate: number;
  };
};

async function resolveHotelSelection(hotelId: string | undefined, roomTypeId: string | undefined, nights: number | undefined, city: "Makkah" | "Madinah") {
  if (!hotelId && !roomTypeId && !nights) return undefined;
  if (!hotelId || !roomTypeId || !nights) {
    throw new AppError(`${city} hotel, room type and nights are all required`, 400);
  }

  const hotel = await prisma.hotel.findFirst({ where: { id: hotelId, active: true, city } });
  if (!hotel) throw new AppError(`${city} hotel is not available`, 400);

  const price = await umrahService.findHotelRoomPrice(hotelId!, roomTypeId!);
  if (!price) {
    throw new AppError(`${city} hotel has no available rate for the selected room type`, 400);
  }

  return { hotel, price, nights };
}

export const customPackageService = {
  async calculate(input: CustomPackageInput): Promise<CustomPackageResult> {
    const settings = await umrahService.getSettings(true);

    const asNonNeg = (v: any, field: string): number => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw new AppError(`${field} must be a non-negative number`, 400);
      return Math.floor(n);
    };

    const adults = asNonNeg(input.adults, "Adults");
    const children = asNonNeg(input.children, "Children");
    const infants = asNonNeg(input.infants, "Infants");

    const totalPax = adults + children + infants;
    if (totalPax < settings.groupPax.min) {
      throw new AppError(`Total group size must be at least ${settings.groupPax.min} person(s)`, 400);
    }
    if (totalPax > settings.groupPax.max) {
      throw new AppError(`Total group size cannot exceed ${settings.groupPax.max} person(s)`, 400);
    }
    if (infants > totalPax) {
      throw new AppError("Infants cannot exceed total group size", 400);
    }

    const seatPax = adults + children;

    const hotels: Array<NonNullable<Awaited<ReturnType<typeof resolveHotelSelection>>>> = [];
    const makkah = await resolveHotelSelection(input.makkahHotelId, input.makkahRoomTypeId, input.makkahNights, "Makkah");
    const madinah = await resolveHotelSelection(input.madinahHotelId, input.madinahRoomTypeId, input.madinahNights, "Madinah");
    if (!makkah && !madinah) {
      throw new AppError("Select at least one hotel for your custom package", 400);
    }
    if (makkah) hotels.push(makkah);
    if (madinah) hotels.push(madinah);

    const items: CustomPackageItem[] = [];

    for (const { hotel, price, nights } of hotels) {
      const rate = Number(price.price);
      const amount = rate * nights * seatPax;
      items.push({
        label: `${hotel.city === "Makkah" ? "Makkah" : "Madinah"} hotel — ${hotel.name}`,
        detail: `${rate} SAR × ${nights} night(s) × ${seatPax} person(s) — ${price.roomType.name} (per person / night)`,
        amount,
      });
    }

    items.push({
      label: "Visa",
      detail: `${settings.visa.base} SAR × ${seatPax} person(s)`,
      amount: settings.visa.base * seatPax,
    });

    const flightRate = umrahService.flightRateForGroup(settings, seatPax);
    items.push({
      label: "Airline ticket",
      detail: `${flightRate} SAR × ${seatPax} person(s)`,
      amount: flightRate * seatPax,
    });

    if (infants > 0) {
      items.push({
        label: "Infant visa",
        detail: `${settings.visa.infant} SAR × ${infants} infant(s)`,
        amount: settings.visa.infant * infants,
      });
    }

    if (input.ziaratMakkah) {
      items.push({
        label: "Makkah ziarat",
        detail: `${settings.ziarat.makkah} SAR × ${seatPax} person(s)`,
        amount: settings.ziarat.makkah * seatPax,
      });
    }

    if (input.ziaratMadina) {
      items.push({
        label: "Madinah ziarat",
        detail: `${settings.ziarat.madinah} SAR × ${seatPax} person(s)`,
        amount: settings.ziarat.madinah * seatPax,
      });
    }

    const sarSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const exchangeRate = settings.currency.sarToPkr;
    const pkrTotal = Math.round(sarSubtotal * exchangeRate);

    return {
      adults,
      children,
      infants,
      seatPax,
      items,
      sarSubtotal,
      exchangeRate,
      pkrTotal,
      currency: { from: settings.currency.from, to: settings.currency.to },
      makkah: makkah
        ? { hotelName: makkah.hotel.name, roomTypeName: makkah.price.roomType.name, nights: makkah.nights, rate: Number(makkah.price.price) }
        : undefined,
      madinah: madinah
        ? { hotelName: madinah.hotel.name, roomTypeName: madinah.price.roomType.name, nights: madinah.nights, rate: Number(madinah.price.price) }
        : undefined,
    };
  },
};

export function summarizeCustom(result: CustomPackageResult): string {
  const lines = [
    `Custom Umrah Package (${result.adults} adult(s), ${result.children} child(ren), ${result.infants} infant(s)):`,
    ...result.items.map((item) => `• ${item.label}: ${item.detail}`),
    `Total: SAR ${result.sarSubtotal} × ${result.exchangeRate} = PKR ${result.pkrTotal.toLocaleString("en-PK")}`,
  ];
  return lines.join("\n");
}