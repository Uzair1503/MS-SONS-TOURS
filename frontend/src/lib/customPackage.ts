import type {
  CustomPackageInput,
  CustomPackageResult,
  CustomPackageItem,
  Hotel,
  UmrahSettings,
} from "@/types";
import { convertSARtoPKR, flightRateForGroup } from "./currency";

// Client-side mirror of the backend /api/custom-package/calculate engine.
// Used ONLY for live preview on the builder page so the summary updates
// instantly. The authoritative result is always re-computed server-side with
// database values when the customer submits.
function seatCounts(input: CustomPackageInput) {
  const adults = Math.max(0, Math.floor(input.adults || 0));
  const children = Math.max(0, Math.floor(input.children || 0));
  const infants = Math.max(0, Math.floor(input.infants || 0));
  return { adults, children, infants, seatPax: adults + children, totalPax: adults + children + infants };
}

export function findRoomPrice(hotel: Hotel, roomTypeId?: string) {
  if (!roomTypeId) return undefined;
  return (hotel.roomPrices || []).find((rp) => rp.roomTypeId === roomTypeId && rp.available);
}

export function computeCustomEstimate(
  input: CustomPackageInput,
  hotelsByCity: { makkah: Hotel[]; madinah: Hotel[] },
  settings: UmrahSettings
): CustomPackageResult {
  const { adults, children, infants, seatPax } = seatCounts(input);
  const items: CustomPackageItem[] = [];

  const makkahHotel = input.makkahHotelId
    ? hotelsByCity.makkah.find((h) => h.id === input.makkahHotelId)
    : undefined;
  const madinahHotel = input.madinahHotelId
    ? hotelsByCity.madinah.find((h) => h.id === input.madinahHotelId)
    : undefined;

  if (makkahHotel) {
    const rp = findRoomPrice(makkahHotel, input.makkahRoomTypeId);
    if (rp && input.makkahNights && input.makkahNights >= 1) {
      const amount = rp.price * input.makkahNights * seatPax;
      items.push({
        label: `Makkah hotel — ${makkahHotel.name}`,
        detail: `${rp.price} SAR × ${input.makkahNights} night(s) × ${seatPax} person(s) — ${rp.roomType.name} (per person / night)`,
        amount,
      });
    }
  }

  if (madinahHotel) {
    const rp = findRoomPrice(madinahHotel, input.madinahRoomTypeId);
    if (rp && input.madinahNights && input.madinahNights >= 1) {
      const amount = rp.price * input.madinahNights * seatPax;
      items.push({
        label: `Madinah hotel — ${madinahHotel.name}`,
        detail: `${rp.price} SAR × ${input.madinahNights} night(s) × ${seatPax} person(s) — ${rp.roomType.name} (per person / night)`,
        amount,
      });
    }
  }

  items.push({
    label: "Visa",
    detail: `${settings.visa.base} SAR × ${seatPax} person(s)`,
    amount: settings.visa.base * seatPax,
  });

  const flightRate = flightRateForGroup(settings, seatPax);
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
  const pkrTotal = convertSARtoPKR(sarSubtotal, settings.currency.sarToPkr);

  return {
    adults,
    children,
    infants,
    seatPax,
    items,
    sarSubtotal,
    exchangeRate: settings.currency.sarToPkr,
    pkrTotal,
    currency: settings.currency,
    makkah:
      makkahHotel && input.makkahRoomTypeId && input.makkahNights
        ? (() => {
            const rp = findRoomPrice(makkahHotel, input.makkahRoomTypeId);
            return rp
              ? { hotelName: makkahHotel.name, roomTypeName: rp.roomType.name, nights: input.makkahNights!, rate: rp.price }
              : undefined;
          })()
        : undefined,
    madinah:
      madinahHotel && input.madinahRoomTypeId && input.madinahNights
        ? (() => {
            const rp = findRoomPrice(madinahHotel, input.madinahRoomTypeId);
            return rp
              ? { hotelName: madinahHotel.name, roomTypeName: rp.roomType.name, nights: input.madinahNights!, rate: rp.price }
              : undefined;
          })()
        : undefined,
  };
}

// Validation mirror (backend re-validates authoritatively on submit).
export function validateCustomInput(
  input: CustomPackageInput,
  settings: UmrahSettings
): { paxError?: string; hotelError?: string; nightsError?: string; valid: boolean } {
  const { totalPax } = seatCounts(input);
  if (totalPax < settings.groupPax.min) return { paxError: `Minimum group size is ${settings.groupPax.min} person(s).`, valid: false };
  if (totalPax > settings.groupPax.max) return { paxError: `Group size cannot exceed ${settings.groupPax.max} person(s).`, valid: false };

  if (input.makkahHotelId || input.madinahHotelId) {
    const makkahOk =
      !input.makkahHotelId ||
      Boolean(input.makkahHotelId && input.makkahRoomTypeId && (input.makkahNights || 0) >= 1);
    const madinahOk =
      !input.madinahHotelId ||
      Boolean(input.madinahHotelId && input.madinahRoomTypeId && (input.madinahNights || 0) >= 1);
    if (!makkahOk || !madinahOk) {
      return { hotelError: "Complete Makkah/Madinah selections (hotel, room type and nights).", valid: false };
    }
    if (input.makkahNights === 0 || input.madinahNights === 0) {
      return { nightsError: "Nights must be at least 1.", valid: false };
    }
  } else {
    return { hotelError: "Select at least one hotel (Makkah or Madinah).", valid: false };
  }

  return { valid: true };
}

export function customSummaryMessage(
  result: CustomPackageResult,
  whatsappNumber: string
): { text: string; url: string } {
  const lines = [
    "Assalam o Alaikum, I am interested in a Custom Umrah package from MS Sons Tours.",
    "",
    `Passengers: ${result.adults} adult(s), ${result.children} child(ren), ${result.infants} infant(s)`,
    ...result.items.map((item) => `• ${item.label}: ${item.detail}`),
    "",
    `SAR Subtotal: ${result.sarSubtotal.toLocaleString("en-PK")} SAR`,
    `Exchange Rate: 1 SAR = ${result.exchangeRate} PKR`,
    `Final Price: PKR ${result.pkrTotal.toLocaleString("en-PK")}`,
    "",
    "Please provide booking details.",
  ];
  const text = lines.join("\n");
  return {
    text,
    url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`,
  };
}