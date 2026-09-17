import { PrismaClient, HotelCategory, PackageStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@mssons.com" },
    update: {},
    create: {
      email: "admin@mssons.com",
      password: adminPassword,
      name: "MS Sons Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin user created");

  // Create room types
  const roomTypes = [
    { name: "Sharing", code: "SHR" },
    { name: "SHR/QUIN", code: "SHRQUIN" },
    { name: "Quint", code: "QUIN" },
    { name: "5-Bed", code: "5BED" },
    { name: "Quad", code: "QUAD" },
    { name: "Triple", code: "TRPL" },
    { name: "Double", code: "DBL" },
  ];

  const createdRoomTypes: Record<string, string> = {};
  for (const rt of roomTypes) {
    const created = await prisma.roomType.upsert({
      where: { name: rt.name },
      update: {},
      create: rt,
    });
    createdRoomTypes[rt.name] = created.id;
  }
  console.log("Room types created");

  // Create airlines
  const airlines = [
    {
      name: "Saudia",
      code: "SV",
      description: "Saudi Arabian Airlines - The national carrier of Saudi Arabia",
      baggageAllowance: "30kg checked + 7kg hand luggage",
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
    },
    {
      name: "PIA",
      code: "PK",
      description: "Pakistan International Airlines - The national carrier of Pakistan",
      baggageAllowance: "23kg checked + 7kg hand luggage",
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
    },
    {
      name: "AirSial",
      code: "PF",
      description: "AirSial - Pakistan's private airline",
      baggageAllowance: "20kg checked + 7kg hand luggage",
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
    },
  ];

  const createdAirlines: Record<string, string> = {};
  for (const a of airlines) {
    const created = await prisma.airline.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
    createdAirlines[a.code] = created.id;
  }
  console.log("Airlines created");

  // Hotel galleries: verified slugs map to N real photos stored as [webp, jpg] pairs;
  // unverified hotels fall back to the representative placeholder SVG.
  const galleryCount: Record<string, number> = {
    "mayer-mayassar": 5,
    "jaddat-al-khalil": 5,
    "multaqa-al-ibadat": 5,
    "miad-al-majid": 5,
    "saif-al-majid": 5,
    "mukarem-al-hijra": 5,
    "makarim-al-hijra": 5,
    "fundaq-al-aliya": 6,
    "hibba-al-hijra-6": 5,
    "tara-al-johra": 1,
    "tara-al-yasmeen": 5,
    "forsan-al-ghad": 5,
  };
  const img = (slug: string): string[] => {
    const count = galleryCount[slug];
    if (!count) return ["/images/hotels/placeholder-hotel.svg"];
    const imgs: string[] = [];
    for (let i = 1; i <= count; i += 1) {
      imgs.push(`/images/hotels/${slug}-${i}.webp`, `/images/hotels/${slug}-${i}.jpg`);
    }
    return imgs;
  };

  // Clean up hotels that no longer exist on the posters
  // (stale "Madinah variant" records and the pre-rename "Hibba Al Hijra")
  const staleHotelNames = [
    "Mukarem Al Hijra Madinah",
    "Mayer Mayassar Madinah",
    "Tara Al Yasmeen Madinah",
    "Hibba Al Hijra",
  ];
  for (const name of staleHotelNames) {
    const stale = await prisma.hotel.findFirst({
      where: { name },
      include: { packageHotels: true },
    });
    if (!stale) continue;
    for (const ph of stale.packageHotels) {
      await prisma.package.updateMany({ where: { makkahHotelId: ph.id }, data: { makkahHotelId: null } });
      await prisma.package.updateMany({ where: { madinahHotelId: ph.id }, data: { madinahHotelId: null } });
      await prisma.packageHotel.delete({ where: { id: ph.id } });
    }
    await prisma.hotel.delete({ where: { id: stale.id } });
    console.log(`Removed stale hotel: ${name}`);
  }

  // Merge duplicate "Jada Al Khalil" into the canonical "Jaddat Al Khalil"
  // so the customer-facing site shows ONE record. Any package that still points
  // to Jada's PackageHotel is repointed to Jaddat's PackageHotel (created if
  // necessary) to preserve associations, then Jada's records are removed.
  const jadaHotel = await prisma.hotel.findFirst({
    where: { name: "Jada Al Khalil" },
    include: { packageHotels: true },
  });
  if (jadaHotel) {
    const jaddatHotel = await prisma.hotel.findFirst({ where: { name: "Jaddat Al Khalil" } });
    for (const ph of jadaHotel.packageHotels) {
      let jaddatPh = jaddatHotel
        ? await prisma.packageHotel.findFirst({ where: { hotelId: jaddatHotel.id } })
        : null;
      if (jaddatHotel && !jaddatPh) {
        jaddatPh = await prisma.packageHotel.create({
          data: { hotelId: jaddatHotel.id, nights: ph.nights, distance: ph.distance },
        });
      }
      if (jaddatPh) {
        await prisma.package.updateMany({ where: { makkahHotelId: ph.id }, data: { makkahHotelId: jaddatPh.id } });
        await prisma.package.updateMany({ where: { madinahHotelId: ph.id }, data: { madinahHotelId: jaddatPh.id } });
      } else {
        await prisma.package.updateMany({ where: { makkahHotelId: ph.id }, data: { makkahHotelId: null } });
        await prisma.package.updateMany({ where: { madinahHotelId: ph.id }, data: { madinahHotelId: null } });
      }
      await prisma.packageHotel.delete({ where: { id: ph.id } });
    }
    await prisma.hotel.delete({ where: { id: jadaHotel.id } });
    console.log("Merged duplicate hotel: Jada Al Khalil -> Jaddat Al Khalil");
  }

  // Create hotels — exactly the 15 on the packaging (poster) data
  const hotels: Array<{
    name: string;
    city: string;
    category: HotelCategory;
    location: string;
    distanceFromHaram?: string;
    distanceFromMasjidNabawi?: string;
    shuttleAvailable: boolean;
    description: string;
    images: string[];
  }> = [
    // ===== Makkah Hotels =====
    {
      name: "Mayer Mayassar",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "2500 m (shuttle)",
      location: "Al Kudai District",
      shuttleAvailable: true,
      description: "Budget-friendly hotel serving pilgrims visiting the Holy Haram.",
      images: img("mayer-mayassar"),
    },
    {
      name: "Jaddat Al Khalil",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "1200 m",
      location: "Ibrahim Khalil Road",
      shuttleAvailable: true,
      description: "Convenient hotel on Ibrahim Khalil Road near the Haram.",
      images: img("jaddat-al-khalil"),
    },
    {
      name: "Multaqa Al Ibadat",
      city: "Makkah",
      category: "ECONOMY" as HotelCategory,
      distanceFromHaram: "700 m",
      location: "Hijra Road",
      shuttleAvailable: true,
      description: "Economy accommodation just 700 m from Masjid al-Haram.",
      images: img("multaqa-al-ibadat"),
    },
    {
      name: "Tara Al Johra",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "700 m",
      location: "Hijra Road",
      shuttleAvailable: true,
      description: "Comfortable stay 700 m from the Haram on Hijra Road.",
      images: img("tara-al-johra"),
    },
    {
      name: "Miad Al Majid",
      city: "Makkah",
      category: "PREMIUM" as HotelCategory,
      distanceFromHaram: "700 m",
      location: "Hijra Road",
      shuttleAvailable: true,
      description: "Premium hotel located 700 m from Masjid al-Haram.",
      images: img("miad-al-majid"),
    },
    {
      name: "Saif Al Majid",
      city: "Makkah",
      category: "PREMIUM" as HotelCategory,
      distanceFromHaram: "600 m",
      location: "Hijra Road",
      shuttleAvailable: true,
      description: "Premium hotel just 600 m from the Holy Haram on Hijra Road.",
      images: img("saif-al-majid"),
    },
    {
      name: "Mukarem Al Hijra",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "600 m",
      location: "Hijra Road",
      shuttleAvailable: true,
      description: "Comfortable stay 600 m from Masjid al-Haram.",
      images: img("mukarem-al-hijra"),
    },
    {
      name: "Makarim Al Hijra",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "700 m",
      location: "Hijra Road",
      shuttleAvailable: true,
      description: "Standard hotel 700 m from the Haram on Hijra Road.",
      images: img("makarim-al-hijra"),
    },
    {
      name: "Hibba Al Hijra 6",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "1100 m (shuttle)",
      location: "Ibrahim Khalil Road",
      shuttleAvailable: true,
      description: "Shuttle-served hotel 1100 m from Masjid al-Haram.",
      images: img("hibba-al-hijra-6"),
    },
    {
      name: "Tara Al Yasmeen",
      city: "Makkah",
      category: "STANDARD" as HotelCategory,
      distanceFromHaram: "550 m",
      location: "Ibrahim Khalil Road",
      shuttleAvailable: true,
      description: "Standard hotel just 550 m from Masjid al-Haram.",
      images: img("tara-al-yasmeen"),
    },
    // ===== Madinah Hotels =====
    {
      name: "Fundaq Al Aliya",
      city: "Madinah",
      category: "ECONOMY" as HotelCategory,
      distanceFromMasjidNabawi: "700 m",
      location: "Central Madinah",
      shuttleAvailable: false,
      description: "Economy hotel 700 m from Masjid an-Nabawi in central Madinah.",
      images: img("fundaq-al-aliya"),
    },
    {
      name: "Forsan Al Ghad",
      city: "Madinah",
      category: "ECONOMY" as HotelCategory,
      distanceFromMasjidNabawi: "1100 m (shuttle)",
      location: "Al Awali District",
      shuttleAvailable: true,
      description: "Shuttle-served hotel 1100 m from Masjid an-Nabawi.",
      images: img("forsan-al-ghad"),
    },
    {
      name: "Zahra Sita",
      city: "Madinah",
      category: "ECONOMY" as HotelCategory,
      distanceFromMasjidNabawi: "700 m",
      location: "Qurban District",
      shuttleAvailable: false,
      description: "Economy hotel 700 m from Masjid an-Nabawi in the Qurban area.",
      images: img("zahra-sita"),
    },
    {
      name: "Majd Al Fiddi",
      city: "Madinah",
      category: "ECONOMY" as HotelCategory,
      distanceFromMasjidNabawi: "450 m",
      location: "Albaik District",
      shuttleAvailable: false,
      description: "Economy hotel just 450 m from Masjid an-Nabawi.",
      images: img("majd-al-fiddi"),
    },
  ];

  const createdHotels: Record<string, string> = {};
  for (const h of hotels) {
    const existing = await prisma.hotel.findFirst({ where: { name: h.name } });
    const data = {
      ...h,
      distanceFromHaram: h.city === "Makkah" ? h.distanceFromHaram ?? null : null,
      distanceFromMasjidNabawi: h.city === "Madinah" ? h.distanceFromMasjidNabawi ?? null : null,
    };
    const created = await prisma.hotel.upsert({
      where: { id: existing?.id ?? "" },
      update: data,
      create: data,
    });
    createdHotels[h.name] = created.id;
  }
  console.log("Hotels created");

  // Helper to upsert a PackageHotel (one per hotel) and return its id
  async function upsertPackageHotel(hotelName: string, nights: number, distance?: string) {
    const hotelId = createdHotels[hotelName];
    if (!hotelId) {
      console.warn(`Hotel not found: ${hotelName}`);
      return null;
    }
    const ph = await prisma.packageHotel.upsert({
      where: { hotelId },
      update: { nights, distance: distance || undefined },
      create: { hotelId, nights, distance: distance || undefined },
    });
    return ph.id;
  }

  // ====== ETIMAD TRAVELS - 21 DAYS ======
  const etimad21Packages = [
    {
      title: "Etimad 21 Days - Package 03",
      packageCode: "ETM21-BUD",
      durationDays: 21,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Multaqa Al Ibadat",
      makkahNights: 15,
      makkahDistance: "700 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 6,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 244000 },
        { roomType: "Quint", price: 252000 },
        { roomType: "Quad", price: 268000 },
        { roomType: "Triple", price: 283000 },
        { roomType: "Double", price: 305000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 21 Days - Package 04",
      packageCode: "ETM21-01",
      durationDays: 21,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Tara Al Johra",
      makkahNights: 15,
      makkahDistance: "700 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 6,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 265000 },
        { roomType: "Quint", price: 275000 },
        { roomType: "Quad", price: 290000 },
        { roomType: "Triple", price: 305000 },
        { roomType: "Double", price: 325000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 21 Days - Package 05",
      packageCode: "ETM21-02",
      durationDays: 21,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Mukarem Al Hijra",
      makkahNights: 15,
      makkahDistance: "600 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 6,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 280000 },
        { roomType: "Quint", price: 290000 },
        { roomType: "Quad", price: 305000 },
        { roomType: "Triple", price: 320000 },
        { roomType: "Double", price: 345000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 21 Days - Package 06",
      packageCode: "ETM21-03",
      durationDays: 21,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Saif Al Majid",
      makkahNights: 15,
      makkahDistance: "600 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 6,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 300000 },
        { roomType: "Quint", price: 310000 },
        { roomType: "Quad", price: 325000 },
        { roomType: "Triple", price: 345000 },
        { roomType: "Double", price: 370000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
  ];

  // ====== ETIMAD TRAVELS - 14 DAYS ======
  const etimad14Packages = [
    {
      title: "Etimad 14 Days - Package 02",
      packageCode: "ETM14-BUD",
      durationDays: 14,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Multaqa Al Ibadat",
      makkahNights: 10,
      makkahDistance: "700 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 4,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 210000 },
        { roomType: "Quint", price: 218000 },
        { roomType: "Quad", price: 232000 },
        { roomType: "Triple", price: 248000 },
        { roomType: "Double", price: 268000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 14 Days - Package 04",
      packageCode: "ETM14-01",
      durationDays: 14,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Tara Al Johra",
      makkahNights: 10,
      makkahDistance: "700 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 4,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 225000 },
        { roomType: "Quint", price: 235000 },
        { roomType: "Quad", price: 248000 },
        { roomType: "Triple", price: 265000 },
        { roomType: "Double", price: 285000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 14 Days - Package 05",
      packageCode: "ETM14-02",
      durationDays: 14,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Mukarem Al Hijra",
      makkahNights: 10,
      makkahDistance: "600 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 4,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 240000 },
        { roomType: "Quint", price: 250000 },
        { roomType: "Quad", price: 265000 },
        { roomType: "Triple", price: 282000 },
        { roomType: "Double", price: 305000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 14 Days - Package 06",
      packageCode: "ETM14-03",
      durationDays: 14,
      provider: "Etimad Travels",
      airlineCode: "SV",
      makkahHotelName: "Saif Al Majid",
      makkahNights: 10,
      makkahDistance: "600 m",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 4,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 255000 },
        { roomType: "Quint", price: 265000 },
        { roomType: "Quad", price: 280000 },
        { roomType: "Triple", price: 298000 },
        { roomType: "Double", price: 320000 },
      ],
      baggageDetails: "30kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
  ];

  // ====== ETIMAD TRAVELS - PIA Packages ======
  const etimadPIAPackages = [
    {
      title: "Etimad 21 Days - PIA Package 01",
      packageCode: "ETM21-PIA-BUD",
      durationDays: 21,
      provider: "Etimad Travels",
      airlineCode: "PK",
      makkahHotelName: "Hibba Al Hijra 6",
      makkahNights: 15,
      makkahDistance: "1100 m (shuttle)",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 6,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 235000 },
        { roomType: "Quint", price: 243000 },
        { roomType: "Quad", price: 258000 },
        { roomType: "Triple", price: 275000 },
        { roomType: "Double", price: 295000 },
      ],
      baggageDetails: "23kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
    {
      title: "Etimad 14 Days - PIA Package 01",
      packageCode: "ETM14-PIA-BUD",
      durationDays: 14,
      provider: "Etimad Travels",
      airlineCode: "PK",
      makkahHotelName: "Hibba Al Hijra 6",
      makkahNights: 10,
      makkahDistance: "1100 m (shuttle)",
      madinahHotelName: "Fundaq Al Aliya",
      madinahNights: 4,
      madinahDistance: "700 m",
      roomPrices: [
        { roomType: "Sharing", price: 200000 },
        { roomType: "Quint", price: 208000 },
        { roomType: "Quad", price: 222000 },
        { roomType: "Triple", price: 238000 },
        { roomType: "Double", price: 258000 },
      ],
      baggageDetails: "23kg checked + 7kg hand",
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
    },
  ];

  // ====== UMR SETS 1-4 (flat single-tier packages) ======
  // Hotels are reused by name from the records above. Where a poster tier lists
  // several equally-spaced alternatives, the FIRST hotel is used as the primary.
  const dist = (name: string): string => {
    const d: Record<string, string> = {
      "Mayer Mayassar": "2500 m (shuttle)",
      "Jaddat Al Khalil": "1200 m",
      "Multaqa Al Ibadat": "700 m",
      "Saif Al Majid": "600 m",
      "Makarim Al Hijra": "700 m",
      "Hibba Al Hijra 6": "1100 m (shuttle)",
      "Tara Al Yasmeen": "550 m",
      "Fundaq Al Aliya": "700 m",
      "Forsan Al Ghad": "1100 m (shuttle)",
      "Zahra Sita": "700 m",
      "Majd Al Fiddi": "450 m",
    };
    return d[name] || "";
  };

  // Row: [title, makkahHotel, madinahHotel, makkahNights, madinahNights, sharing, quad, triple, double]
  const flatMany = (
    opts: {
      codePrefix: string;
      durationDays: number;
      airlineCode: string;
      firstRoomType: string;
      baggageDetails: string;
      infantRate?: number;
      childWithoutBedRate?: number;
    },
    rows: Array<[string, string, string, number, number, number, number, number, number]>
  ) =>
    rows.map((r, i) => ({
      title: r[0],
      packageCode: `${opts.codePrefix}-${["BUD", "01", "02", "03"][i]}`,
      durationDays: opts.durationDays,
      airlineCode: opts.airlineCode,
      makkahHotelName: r[1],
      makkahNights: r[3],
      makkahDistance: dist(r[1]),
      madinahHotelName: r[2],
      madinahNights: r[4],
      madinahDistance: dist(r[2]),
      roomPrices: [
        { roomType: opts.firstRoomType, price: r[5] },
        { roomType: "Quad", price: r[6] },
        { roomType: "Triple", price: r[7] },
        { roomType: "Double", price: r[8] },
      ],
      baggageDetails: opts.baggageDetails,
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
      infantRate: opts.infantRate,
      childWithoutBedRate: opts.childWithoutBedRate,
    }));

  // Set 1 - 21 Days, Saudia
  const umrSet1 = flatMany(
    {
      codePrefix: "UMR21SV",
      durationDays: 21,
      airlineCode: "SV",
      firstRoomType: "Sharing",
      baggageDetails: "30kg checked + 7kg hand",
      infantRate: 85000,
      childWithoutBedRate: 198000,
    },
    [
      ["Budget Package", "Mayer Mayassar", "Fundaq Al Aliya", 15, 5, 244000, 252000, 268000, 283000],
      ["Package 01", "Jaddat Al Khalil", "Fundaq Al Aliya", 14, 6, 251000, 263000, 276000, 299000],
      ["Package 02", "Multaqa Al Ibadat", "Fundaq Al Aliya", 12, 8, 258000, 272000, 286000, 310000],
      ["Package 03", "Saif Al Majid", "Fundaq Al Aliya", 12, 9, 265000, 279000, 294000, 321000],
    ]
  );

  // Set 2 - 21 Days, PIA (sharing seat is a 5-bed)
  const umrSet2 = flatMany(
    {
      codePrefix: "UMR21PK",
      durationDays: 21,
      airlineCode: "PK",
      firstRoomType: "5-Bed",
      baggageDetails: "23kg checked + 7kg hand",
      infantRate: 85000,
      childWithoutBedRate: 198000,
    },
    [
      ["Budget Package", "Mayer Mayassar", "Fundaq Al Aliya", 15, 5, 239000, 247000, 263000, 278000],
      ["Package 01", "Jaddat Al Khalil", "Fundaq Al Aliya", 14, 6, 246000, 258000, 271000, 294000],
      ["Package 02", "Multaqa Al Ibadat", "Fundaq Al Aliya", 12, 8, 253000, 267000, 281000, 305000],
      ["Package 03", "Saif Al Majid", "Fundaq Al Aliya", 12, 9, 260000, 274000, 289000, 321000],
    ]
  );

  // Set 3 - 14 Days, PIA (sharing seat is a 5-bed)
  const umrSet3 = flatMany(
    {
      codePrefix: "UMR14PK",
      durationDays: 14,
      airlineCode: "PK",
      firstRoomType: "5-Bed",
      baggageDetails: "23kg checked + 7kg hand",
      infantRate: 85000,
      childWithoutBedRate: 198000,
    },
    [
      ["Budget Package", "Mayer Mayassar", "Fundaq Al Aliya", 10, 4, 228000, 237000, 253000, 263000],
      ["Package 01", "Jaddat Al Khalil", "Fundaq Al Aliya", 9, 5, 235000, 248000, 261000, 279000],
      ["Package 02", "Multaqa Al Ibadat", "Fundaq Al Aliya", 8, 6, 242000, 257000, 271000, 290000],
      ["Package 03", "Saif Al Majid", "Fundaq Al Aliya", 8, 6, 249000, 264000, 279000, 306000],
    ]
  );

  // Set 4 - 21 Days, AirSial (20+7kg baggage)
  const umrSet4 = flatMany(
    {
      codePrefix: "UMR21PF",
      durationDays: 21,
      airlineCode: "PF",
      firstRoomType: "Sharing",
      baggageDetails: "20kg checked + 7kg hand",
      infantRate: 95000,
      childWithoutBedRate: 205000,
    },
    [
      ["Budget Package", "Mayer Mayassar", "Fundaq Al Aliya", 15, 5, 237000, 243000, 253000, 273000],
      ["Package 01", "Jaddat Al Khalil", "Fundaq Al Aliya", 14, 6, 244000, 256000, 269000, 292000],
      ["Package 02", "Multaqa Al Ibadat", "Fundaq Al Aliya", 12, 8, 249000, 262000, 275000, 303000],
      ["Package 03", "Saif Al Majid", "Fundaq Al Aliya", 12, 9, 255000, 270000, 287000, 321000],
    ]
  );

  // ====== CODE 17 / CODE 16 COMBO PACKAGES (7 hotel combos x 14 & 21 days) ======
  // Supersedes the previous single-row PHM16/PHM17 packages with the full
  // "Budget + Package 01..06" poster structure. Col 1 = Sharing/Quint (Quint on
  // the Tara Al Yasmeen row). Row: [makkah, madinah, 14s, 14q, 14t, 14d, 21s, 21q, 21t, 21d]
  const comboMany = (
    opts: { codePrefix: string; airlineCode: string; baggageDetails: string },
    rows: Array<[string, string, number, number, number, number, number, number, number, number]>
  ) => {
    const out: any[] = [];
    rows.forEach((r, i) => {
      const label = i === 0 ? "Budget Package" : `Package 0${i}`;
      const shareType = i === 6 ? "Quint" : "SHR/QUIN";
      const base = {
        airlineCode: opts.airlineCode,
        makkahHotelName: r[0],
        makkahDistance: dist(r[0]),
        madinahHotelName: r[1],
        madinahDistance: dist(r[1]),
        baggageDetails: opts.baggageDetails,
        visaIncluded: true,
        ticketIncluded: true,
        hotelIncluded: true,
        transportIncluded: true,
      };
      out.push(
        {
          ...base,
          title: label,
          packageCode: `${opts.codePrefix}-${String(i + 1).padStart(2, "0")}-14`,
          durationDays: 14,
          makkahNights: 9,
          madinahNights: 5,
          roomPrices: [
            { roomType: shareType, price: r[2] },
            { roomType: "Quad", price: r[3] },
            { roomType: "Triple", price: r[4] },
            { roomType: "Double", price: r[5] },
          ],
        },
        {
          ...base,
          title: label,
          packageCode: `${opts.codePrefix}-${String(i + 1).padStart(2, "0")}-21`,
          durationDays: 21,
          makkahNights: 14,
          madinahNights: 6,
          roomPrices: [
            { roomType: shareType, price: r[6] },
            { roomType: "Quad", price: r[7] },
            { roomType: "Triple", price: r[8] },
            { roomType: "Double", price: r[9] },
          ],
        }
      );
    });
    return out;
  };

  // Code 17 - AirSial
  const umrSet5 = comboMany(
    { codePrefix: "UMR17", airlineCode: "PF", baggageDetails: "20kg checked + 7kg hand" },
    [
      ["Mayer Mayassar", "Forsan Al Ghad", 225480, 227000, 231560, 240600, 229500, 231560, 238640, 249800],
      ["Hibba Al Hijra 6", "Forsan Al Ghad", 227000, 228700, 233840, 244100, 231900, 234220, 241200, 255120],
      ["Jaddat Al Khalil", "Forsan Al Ghad", 230040, 232130, 238400, 250940, 236700, 239500, 248300, 265760],
      ["Jaddat Al Khalil", "Zahra Sita", 233450, 235930, 243500, 258540, 240680, 244100, 254360, 274880],
      ["Makarim Al Hijra", "Zahra Sita", 245600, 249610, 261700, 285900, 259600, 265380, 282750, 317440],
      ["Makarim Al Hijra", "Majd Al Fiddi", 246500, 250500, 262900, 287800, 260600, 266520, 284250, 319720],
      ["Tara Al Yasmeen", "Majd Al Fiddi", 250900, 255690, 269800, 298060, 267700, 274500, 294900, 335680],
    ]
  );

  // Code 16 - Saudia
  const umrSet6 = comboMany(
    { codePrefix: "UMR16", airlineCode: "SV", baggageDetails: "30kg checked + 7kg hand" },
    [
      ["Mayer Mayassar", "Forsan Al Ghad", 233480, 235000, 239560, 248680, 237500, 239560, 246640, 257800],
      ["Hibba Al Hijra 6", "Forsan Al Ghad", 235000, 236700, 241840, 252100, 239900, 242220, 249200, 263120],
      ["Jaddat Al Khalil", "Forsan Al Ghad", 238040, 240130, 246400, 258940, 244700, 247500, 256300, 273760],
      ["Jaddat Al Khalil", "Zahra Sita", 241400, 243930, 251500, 266540, 248680, 252100, 262360, 282880],
      ["Makarim Al Hijra", "Zahra Sita", 253600, 257610, 269700, 293900, 267600, 273380, 290750, 325440],
      ["Makarim Al Hijra", "Majd Al Fiddi", 254500, 258500, 270900, 295800, 268600, 274520, 292250, 327720],
      ["Tara Al Yasmeen", "Majd Al Fiddi", 258900, 263690, 277800, 306060, 275700, 282500, 302900, 343680],
    ]
  );

  type SeedPackage = {
  title: string;
  packageCode: string;
  durationDays: number;
  airlineCode: string;
  makkahHotelName: string;
  makkahNights: number;
  makkahDistance: string;
  madinahHotelName: string;
  madinahNights: number;
  madinahDistance: string;
  roomPrices: Array<{ roomType: string; price: number }>;
  baggageDetails: string;
  visaIncluded: boolean;
  ticketIncluded: boolean;
  hotelIncluded: boolean;
  transportIncluded: boolean;
  infantRate?: number;
  childWithoutBedRate?: number;
  childRate?: number;
};

  const allPackages: SeedPackage[] = [
    ...etimad21Packages,
    ...etimad14Packages,
    ...etimadPIAPackages,
    ...umrSet1,
    ...umrSet2,
    ...umrSet3,
    ...umrSet4,
    ...umrSet5,
    ...umrSet6,
  ];

  // Package display metadata: standardized titles (Budget Package / Package 01..06
  // per duration, ordered by starting price), sort order, and exact departure/return
  // dates from the source posters (Sept 2026). Provider names stay in the DB for
  // admin use only - they are never shown on the customer-facing site.
  const packageMeta: Record<string, {
    title: string;
    sortOrder: number;
    departureDate?: string;
    returnDate?: string;
    departureDates?: string;
    returnDates?: string;
  }> = {
    // ===== 14 days =====
    "ETM14-PIA-BUD": {
      title: "Package 01", sortOrder: 2,
      departureDate: "2026-09-10", returnDate: "2026-09-25",
      departureDates: "2026-09-10", returnDates: "2026-09-25",
    },
    "ETM14-BUD": { title: "Package 02", sortOrder: 3 },
    "ETM14-01": { title: "Package 04", sortOrder: 5 },
    "ETM14-02": { title: "Package 05", sortOrder: 6 },
    "ETM14-03": { title: "Package 06", sortOrder: 7 },
    // ===== 21 days =====
    "ETM21-PIA-BUD": {
      title: "Package 01", sortOrder: 9,
      departureDate: "2026-09-12", returnDate: "2026-10-02",
      departureDates: "2026-09-12, 2026-09-17",
      returnDates: "2026-10-02, 2026-10-09",
    },
    "ETM21-BUD": {
      title: "Package 03", sortOrder: 11,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "ETM21-01": {
      title: "Package 04", sortOrder: 12,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "ETM21-02": {
      title: "Package 05", sortOrder: 13,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "ETM21-03": {
      title: "Package 06", sortOrder: 14,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    // ===== 14 days - UMR (Set 3, Code 17, Code 16) =====
    "UMR14PK-BUD": {
      title: "Budget Package", sortOrder: 15,
      departureDate: "2026-09-10", returnDate: "2026-09-25",
      departureDates: "2026-09-10", returnDates: "2026-09-25",
    },
    "UMR14PK-01": {
      title: "Package 01", sortOrder: 16,
      departureDate: "2026-09-10", returnDate: "2026-09-25",
      departureDates: "2026-09-10", returnDates: "2026-09-25",
    },
    "UMR14PK-02": {
      title: "Package 02", sortOrder: 17,
      departureDate: "2026-09-10", returnDate: "2026-09-25",
      departureDates: "2026-09-10", returnDates: "2026-09-25",
    },
    "UMR14PK-03": {
      title: "Package 03", sortOrder: 18,
      departureDate: "2026-09-10", returnDate: "2026-09-25",
      departureDates: "2026-09-10", returnDates: "2026-09-25",
    },
    "UMR17-01-14": { title: "Budget Package", sortOrder: 19 },
    "UMR17-02-14": { title: "Package 01", sortOrder: 20 },
    "UMR17-03-14": { title: "Package 02", sortOrder: 21 },
    "UMR17-04-14": { title: "Package 03", sortOrder: 22 },
    "UMR17-05-14": { title: "Package 04", sortOrder: 23 },
    "UMR17-06-14": { title: "Package 05", sortOrder: 24 },
    "UMR17-07-14": { title: "Package 06", sortOrder: 25 },
    "UMR16-01-14": { title: "Budget Package", sortOrder: 26 },
    "UMR16-02-14": { title: "Package 01", sortOrder: 27 },
    "UMR16-03-14": { title: "Package 02", sortOrder: 28 },
    "UMR16-04-14": { title: "Package 03", sortOrder: 29 },
    "UMR16-05-14": { title: "Package 04", sortOrder: 30 },
    "UMR16-06-14": { title: "Package 05", sortOrder: 31 },
    "UMR16-07-14": { title: "Package 06", sortOrder: 32 },
    // ===== 21 days - UMR (Sets 1, 2, 4, Code 17, Code 16) =====
    "UMR21SV-BUD": {
      title: "Budget Package", sortOrder: 33,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "UMR21SV-01": {
      title: "Package 01", sortOrder: 34,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "UMR21SV-02": {
      title: "Package 02", sortOrder: 35,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "UMR21SV-03": {
      title: "Package 03", sortOrder: 36,
      departureDate: "2026-09-13", returnDate: "2026-10-03",
      departureDates: "2026-09-13, 2026-09-16",
      returnDates: "2026-10-03, 2026-10-05",
    },
    "UMR21PK-BUD": {
      title: "Budget Package", sortOrder: 37,
      departureDate: "2026-09-12", returnDate: "2026-10-02",
      departureDates: "2026-09-12, 2026-09-17",
      returnDates: "2026-10-02, 2026-10-09",
    },
    "UMR21PK-01": {
      title: "Package 01", sortOrder: 38,
      departureDate: "2026-09-12", returnDate: "2026-10-02",
      departureDates: "2026-09-12, 2026-09-17",
      returnDates: "2026-10-02, 2026-10-09",
    },
    "UMR21PK-02": {
      title: "Package 02", sortOrder: 39,
      departureDate: "2026-09-12", returnDate: "2026-10-02",
      departureDates: "2026-09-12, 2026-09-17",
      returnDates: "2026-10-02, 2026-10-09",
    },
    "UMR21PK-03": {
      title: "Package 03", sortOrder: 40,
      departureDate: "2026-09-12", returnDate: "2026-10-02",
      departureDates: "2026-09-12, 2026-09-17",
      returnDates: "2026-10-02, 2026-10-09",
    },
    "UMR21PF-BUD": {
      title: "Budget Package", sortOrder: 41,
      departureDate: "2026-09-09", returnDate: "2026-09-29",
      departureDates: "2026-09-09", returnDates: "2026-09-29",
    },
    "UMR21PF-01": {
      title: "Package 01", sortOrder: 42,
      departureDate: "2026-09-09", returnDate: "2026-09-29",
      departureDates: "2026-09-09", returnDates: "2026-09-29",
    },
    "UMR21PF-02": {
      title: "Package 02", sortOrder: 43,
      departureDate: "2026-09-09", returnDate: "2026-09-29",
      departureDates: "2026-09-09", returnDates: "2026-09-29",
    },
    "UMR21PF-03": {
      title: "Package 03", sortOrder: 44,
      departureDate: "2026-09-09", returnDate: "2026-09-29",
      departureDates: "2026-09-09", returnDates: "2026-09-29",
    },
    "UMR17-01-21": { title: "Budget Package", sortOrder: 45 },
    "UMR17-02-21": { title: "Package 01", sortOrder: 46 },
    "UMR17-03-21": { title: "Package 02", sortOrder: 47 },
    "UMR17-04-21": { title: "Package 03", sortOrder: 48 },
    "UMR17-05-21": { title: "Package 04", sortOrder: 49 },
    "UMR17-06-21": { title: "Package 05", sortOrder: 50 },
    "UMR17-07-21": { title: "Package 06", sortOrder: 51 },
    "UMR16-01-21": { title: "Budget Package", sortOrder: 52 },
    "UMR16-02-21": { title: "Package 01", sortOrder: 53 },
    "UMR16-03-21": { title: "Package 02", sortOrder: 54 },
    "UMR16-04-21": { title: "Package 03", sortOrder: 55 },
    "UMR16-05-21": { title: "Package 04", sortOrder: 56 },
    "UMR16-06-21": { title: "Package 05", sortOrder: 57 },
    "UMR16-07-21": { title: "Package 06", sortOrder: 58 },
  };

  // All Code 17 / Code 16 combos share the same flight dates per duration.
  const comboDateSets: Record<string, {
    departureDate?: string;
    returnDate?: string;
    departureDates?: string;
    returnDates?: string;
  }> = {
    "17-14": {
      departureDate: "2026-09-13", returnDate: "2026-09-27",
      departureDates: "2026-09-13, 2026-09-17, 2026-09-19, 2026-09-21",
      returnDates: "2026-09-27, 2026-10-01, 2026-10-03, 2026-10-05",
    },
    "17-21": {
      departureDate: "2026-09-18", returnDate: "2026-10-09",
      departureDates: "2026-09-18, 2026-09-20",
      returnDates: "2026-10-09, 2026-10-11",
    },
    "16-14": {
      departureDate: "2026-09-09", returnDate: "2026-09-23",
      departureDates: "2026-09-09, 2026-09-12, 2026-09-15, 2026-09-22, 2026-09-24, 2026-09-27, 2026-09-30",
      returnDates: "2026-09-23, 2026-09-26, 2026-09-29, 2026-10-06, 2026-10-08, 2026-10-11, 2026-10-14",
    },
    "16-21": {
      departureDate: "2026-09-16", returnDate: "2026-10-07",
      departureDates: "2026-09-16, 2026-09-20, 2026-09-23, 2026-09-25, 2026-09-26, 2026-09-29",
      returnDates: "2026-10-07, 2026-10-11, 2026-10-14, 2026-10-16, 2026-10-17, 2026-10-20",
    },
  };
  for (const code of Object.keys(packageMeta)) {
    for (const key of ["17", "16"]) {
      for (const dur of ["14", "21"]) {
        if (code.startsWith(`UMR${key}-`) && code.endsWith(`-${dur}`)) {
          packageMeta[code] = { ...packageMeta[code], ...comboDateSets[`${key}-${dur}`] };
        }
      }
    }
  }

  // Remove the superseded single-row PHM16/PHM17 packages (codes 16/17 are now
  // represented by the full 7-combo x 14&21-day structure in umrSet5/umrSet6).
  for (const code of ["PHM17-14", "PHM17-21", "PHM16-14", "PHM16-21"]) {
    const oldPkg = await prisma.package.findFirst({ where: { packageCode: code } });
    if (oldPkg) {
      await prisma.package.delete({ where: { id: oldPkg.id } });
      console.log(`Removed superseded package: ${code}`);
    }
  }

  for (const pkg of allPackages) {
    const airlineId = createdAirlines[pkg.airlineCode] || null;
    const makkahHotelId = await upsertPackageHotel(pkg.makkahHotelName, pkg.makkahNights, pkg.makkahDistance);
    const madinahHotelId = await upsertPackageHotel(pkg.madinahHotelName, pkg.madinahNights, pkg.madinahDistance);

    const meta = packageMeta[pkg.packageCode];
    const airlineName = createdAirlines[pkg.airlineCode]
      ? await prisma.airline.findUnique({ where: { id: airlineId! } }).then((a) => a?.name || null)
      : null;

    const pkgData = {
      title: meta?.title ?? pkg.title,
      durationDays: pkg.durationDays,
      status: PackageStatus.ACTIVE,
      description: `${pkg.makkahHotelName} in Makkah (${pkg.makkahDistance}). ${pkg.madinahHotelName} in Madinah (${pkg.madinahDistance}). ${pkg.durationDays}-day Umrah package${airlineName ? ` with ${airlineName} flights` : ""} from Islamabad to Jeddah.`,
      provider: pkg.provider,
      airlineId,
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
      departureDate: meta?.departureDate ? new Date(meta.departureDate) : null,
      returnDate: meta?.returnDate ? new Date(meta.returnDate) : null,
      departureDates: meta?.departureDates ?? null,
      returnDates: meta?.returnDates ?? null,
      sortOrder: meta?.sortOrder ?? 0,
      baggageDetails: pkg.baggageDetails,
      infantRate: pkg.infantRate ?? null,
      childWithoutBedRate: pkg.childWithoutBedRate ?? null,
      childRate: pkg.childRate ?? null,
      visaIncluded: pkg.visaIncluded,
      ticketIncluded: pkg.ticketIncluded,
      hotelIncluded: pkg.hotelIncluded,
      transportIncluded: pkg.transportIncluded,
      makkahHotelId,
      makkahNights: pkg.makkahNights,
      makkahDistance: pkg.makkahDistance,
      madinahHotelId,
      madinahNights: pkg.madinahNights,
      madinahDistance: pkg.madinahDistance,
    };

    const existingPkg = await prisma.package.findFirst({ where: { packageCode: pkg.packageCode } });
    if (existingPkg) {
      await prisma.package.update({ where: { id: existingPkg.id }, data: pkgData });
      continue;
    }

    const createdPkg = await prisma.package.create({
      data: { ...pkgData, packageCode: pkg.packageCode },
    });

    for (const rp of pkg.roomPrices) {
      const roomTypeId = createdRoomTypes[rp.roomType];
      if (roomTypeId) {
        await prisma.packageRoomPrice.create({
          data: {
            packageId: createdPkg.id,
            roomTypeId,
            price: rp.price,
            currency: "PKR",
            available: true,
          },
        });
      }
    }
  }
  console.log("Packages created");

  // Create site settings
  const defaultSettings = [
    { key: "business_name", value: "MS Sons Tours", category: "general" },
    { key: "whatsapp_number", value: "923713011519", category: "contact" },
    { key: "phone_number", value: "+923145802373", category: "contact" },
    { key: "email", value: "mssonstravel@gmail.com", category: "contact" },
    { key: "address", value: "Wah Model Town Phase II", category: "contact" },
    { key: "website_title", value: "MS Sons Tours - Hajj & Umrah Travel", category: "seo" },
    { key: "website_description", value: "Professional Hajj & Umrah travel packages from Pakistan. 14 and 21 day packages with multiple airlines and hotels.", category: "seo" },
    { key: "terms_rates", value: "Package rates may change daily. Finalized bookings may be non-refundable and non-changeable.", category: "terms" },
    { key: "terms_booking", value: "Booking is confirmed upon receipt of advance payment. Full payment required before departure.", category: "terms" },
    { key: "terms_cancellation", value: "Cancellation policies vary by package and airline. Contact us for specific details.", category: "terms" },
    { key: "terms_visa", value: "Visa processing is included in package price. Processing time may vary.", category: "terms" },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("Settings created");

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });