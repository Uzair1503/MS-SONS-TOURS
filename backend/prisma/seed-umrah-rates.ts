import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Idempotent seed for the Custom Umrah Package Builder:
//  - adds the "Room" room type
//  - normalizes the variant hotel names (existing records updated in place,
//    ids preserved so package links stay intact)
//  - seeds per-person / per-night SAR rates for the 8 rate hotels
//  - seeds the umrah settings (validity, condition, pax, currency, visa,
//    flight tiers, infant visa, ziarat, terms) as DB source-of-truth
//
// NOTE: hotel rates below are placeholders seeded from the shared ranges in
// the requirements. Every value is admin-editable and re-seeding is safe
// (upserts, never duplicates).

const ROOM_TYPES = [
  { name: "Sharing", code: "SHR" },
  { name: "SHR/QUIN", code: "SHRQUIN" },
  { name: "Quint", code: "QUIN" },
  { name: "5-Bed", code: "5BED" },
  { name: "Quad", code: "QUAD" },
  { name: "Triple", code: "TRPL" },
  { name: "Double", code: "DBL" },
  { name: "Room", code: "ROOM" },
];

// Maps the current DB name to the canonical rate-table name.
const HOTEL_RENAMES: Record<string, string> = {
  "Mayer Mayassar": "Mayar Moyasar",
  "Hibba Al Hijra 6": "Hiba Al Hijra 6",
  "Jaddat Al Khalil": "Jada Al Mashaer",
};

// Canonical names + city of the 8 hotels in the rate table.
const RATE_HOTELS = [
  { name: "Mayar Moyasar", city: "Makkah" },
  { name: "Hiba Al Hijra 6", city: "Makkah" },
  { name: "Jada Al Mashaer", city: "Makkah" },
  { name: "Makarim Al Hijra", city: "Makkah" },
  { name: "Tara Al Yasmeen", city: "Makkah" },
  { name: "Forsan Al Ghad", city: "Madinah" },
  { name: "Zahra Sita", city: "Madinah" },
  { name: "Majd Al Fiddi", city: "Madinah" },
];

// Per person / per night, SAR: Sharing, Quint, Quad, Triple, Double, Room.
const HOTEL_RATES: Record<string, Record<string, number>> = {
  "Mayar Moyasar": { Sharing: 17, Quint: 17, Quad: 72, Triple: 72, Double: 72, Room: 72 },
  "Hiba Al Hijra 6": { Sharing: 19, Quint: 19, Quad: 82, Triple: 82, Double: 82, Room: 82 },
  "Jada Al Mashaer": { Sharing: 29, Quint: 29, Quad: 127, Triple: 127, Double: 127, Room: 127 },
  "Makarim Al Hijra": { Sharing: 43, Quint: 43, Quad: 187, Triple: 187, Double: 187, Room: 187 },
  "Tara Al Yasmeen": { Sharing: 52, Quint: 52, Quad: 227, Triple: 227, Double: 227, Room: 227 },
  "Forsan Al Ghad": { Sharing: 28, Quint: 28, Quad: 122, Triple: 122, Double: 122, Room: 122 },
  "Zahra Sita": { Sharing: 35, Quint: 35, Quad: 152, Triple: 152, Double: 152, Room: 152 },
  "Majd Al Fiddi": { Sharing: 44, Quint: 44, Quad: 192, Triple: 192, Double: 192, Room: 192 },
};

// Room types that participate in the custom package builder. Rates are
// reconciled per hotel: rows for room types outside this set are removed so
// the database remains the only source of truth for what is offered.
const RATE_ROOM_TYPE_NAMES = ["Sharing", "Quint", "Quad", "Triple", "Double", "Room"];

const UMRAH_SETTINGS: Array<{ key: string; value: string; category: string }> = [
  { key: "umrah_validity", value: "2026-09-30", category: "umrah" },
  { key: "umrah_condition", value: "Visa Ticket must be with Direct Airline.", category: "umrah" },
  { key: "group_pax_min", value: "1", category: "umrah" },
  { key: "group_pax_max", value: "49", category: "umrah" },
  { key: "currency_sar_to_pkr", value: "75", category: "umrah" },
  { key: "visa_base_rate", value: "580", category: "umrah" },
  { key: "flight_rate_1pax", value: "705", category: "umrah" },
  { key: "flight_rate_2pax", value: "680", category: "umrah" },
  { key: "flight_rate_3pax", value: "655", category: "umrah" },
  { key: "flight_rate_4pax", value: "630", category: "umrah" },
  { key: "infant_visa_rate", value: "465", category: "umrah" },
  { key: "ziarat_makkah", value: "12", category: "umrah" },
  { key: "ziarat_madina", value: "12", category: "umrah" },
  {
    key: "umrah_terms",
    value: JSON.stringify([
      "1. All rates are in Saudi Arabia Riyals (SAR).",
      "2. Visa Riyal rate charge at passport submission & voucher rate at voucher making date. Booking will start after 100% full payment.",
      "3. All packages are non-refundable & non-changeable.",
      "4. Overstay fine: 25,000 SAR per person.",
      "5. Any additional tax imposed by Pakistan or KSA Govt will be charged.",
      "6. All send to Embassy cases will charge as per market rate.",
      "7. Package will change any time without prior notice. Hotel Voucher are not linked with visa issuance date.",
    ]),
    category: "umrah",
  },
];

async function main() {
  console.log("Seeding umrah rates...");

  // 1. Room types (add "Room", keep others intact)
  for (const rt of ROOM_TYPES) {
    const existing = await prisma.roomType.findFirst({ where: { OR: [{ name: rt.name }, { code: rt.code }] } });
    if (existing) {
      if (existing.name !== rt.name || existing.code !== rt.code) {
        await prisma.roomType.update({ where: { id: existing.id }, data: { name: rt.name, code: rt.code, active: true } });
        console.log(`  room type updated: ${existing.name} -> ${rt.name}`);
      }
    } else {
      await prisma.roomType.create({ data: rt });
      console.log(`  room type created: ${rt.name}`);
    }
  }

  // 2. Normalize hotel names (update records in place, no duplication)
  for (const [oldName, newName] of Object.entries(HOTEL_RENAMES)) {
    const old = await prisma.hotel.findFirst({ where: { name: oldName } });
    if (old) {
      await prisma.hotel.update({ where: { id: old.id }, data: { name: newName } });
      console.log(`  hotel renamed: ${oldName} -> ${newName}`);
    } else {
      const maybe = await prisma.hotel.findFirst({ where: { name: newName } });
      if (!maybe) console.warn(`  WARN: hotel not found for rename: ${oldName} (${newName})`);
    }
  }

  // 3. Seed per-hotel room rates
  const roomTypes = await prisma.roomType.findMany({ select: { id: true, name: true } });
  const rtByName = new Map(roomTypes.map((r) => [r.name, r.id]));

  let rateCount = 0;
  for (const { name, city } of RATE_HOTELS) {
    const hotel = await prisma.hotel.findFirst({ where: { name, city } });
    if (!hotel) {
      console.warn(`  WARN: rate hotel not found: ${name} (${city})`);
      continue;
    }
    const rates = HOTEL_RATES[name];
    if (!rates) {
      console.warn(`  WARN: no rate row for hotel: ${name}`);
      continue;
    }
    // Reconcile: remove prices for room types no longer in the rate set
    // (so, for example, a SHR/QUIN row seeded earlier never lingers).
    const rateRoomTypeIds = Object.keys(rates)
      .map((roomName) => rtByName.get(roomName))
      .filter(Boolean);
    const deleted = await prisma.hotelRoomPrice.deleteMany({
      where: { hotelId: hotel.id, roomTypeId: { notIn: rateRoomTypeIds as string[] } },
    });
    if (deleted.count > 0) {
      console.log(`  rates removed: ${name} (${deleted.count} room type(s) not in the rate set)`);
    }
    for (const [roomName, price] of Object.entries(rates)) {
      const roomTypeId = rtByName.get(roomName);
      if (!roomTypeId) {
        console.warn(`  WARN: room type missing for rate: ${roomName}`);
        continue;
      }
      const key = { hotelId: hotel.id, roomTypeId };
      const existingRp = await prisma.hotelRoomPrice.findUnique({ where: { hotelId_roomTypeId: key } });
      if (existingRp) {
        if (existingRp.price !== price || !existingRp.available) {
          await prisma.hotelRoomPrice.update({ where: { id: existingRp.id }, data: { price, available: true } });
          console.log(`  rate updated: ${name} / ${roomName} = ${price}`);
        }
      } else {
        await prisma.hotelRoomPrice.create({ data: { ...key, price } });
        console.log(`  rate created: ${name} / ${roomName} = ${price}`);
        rateCount++;
      }
    }
  }
  console.log(`  hotel rates seeded (${rateCount} new).`);

  // 4. Umrah settings
  for (const s of UMRAH_SETTINGS) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: s.key } });
    if (existing) {
      if (existing.value !== s.value) {
        await prisma.siteSetting.update({ where: { key: s.key }, data: { value: s.value, category: s.category } });
        console.log(`  setting updated: ${s.key}`);
      }
    } else {
      await prisma.siteSetting.create({ data: s });
      console.log(`  setting created: ${s.key}`);
    }
  }

  console.log("Umrah rates seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());