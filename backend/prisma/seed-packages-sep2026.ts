import { PrismaClient, PackageStatus } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// =============================================================================
// Seed: September / October 2026 flyer packages
// -----------------------------------------------------------------------------
// Ingests three flyer CSVs (backend/prisma/):
//   1. flyer1_saudia_15_21days.csv          - 10 hotel-pairs x (15d, 21d) = 20 packages
//   2. flyer2_21days_spiritual_journey.csv  - 4 x 21-day packages
//   3. flyer3_sep_oct_2026.csv              - 7 categories x (14d, 22d) = 14 packages
//
// Idempotent by design: every entity is upserted on a stable key
// (RoomType.name, Hotel.name, Package.packageCode, PackageRoomPrice
// [packageId + roomTypeId]), so re-running never duplicates.
//
// Prices are transcribed verbatim from the CSVs. An EMPTY price cell means that
// room type is simply NOT OFFERED for that package - no PackageRoomPrice row is
// created (the schema requires a non-null Float price, and inserting 0/null
// would misrepresent the flyer).
//
// Hotel reuse: flyer names that correspond to hotels already seeded by
// seed.ts (e.g. "Saif Al Majd" -> "Saif Al Majid", "Mayar Moyassar or Similar
// (2500 MTR) Kudai" -> "Mayer Mayassar") are linked to the existing record so
// the customer-facing site does not show duplicates. Only hotels that have no
// existing match are created fresh. Reused hotels are never modified.
//
// Flyer 1 (Saudia 15/21-day) additionally: names packages "15 Days Package NN"
// / "21 Days Package NN", links each package to the existing Saudia airline
// (created only if missing), stores the four official flyer terms in
// Package.termsAndConditions, writes the flight-group departure/return dates
// as ISO date strings on the package, and creates the 6 FlightSchedule rows
// (2 x 15d, 4 x 21d) for that airline. The "5 + 3" / "6 + 6" Makkah night
// splits from the flyer rows are preserved verbatim in the package description.
//
// NOTE (schema decision - flyer 2): the flat Infant (0-2 yrs) = 95,000 PKR and
// Child (without bed) = 200,000 PKR rates cannot be expressed as per-room-type
// PackageRoomPrice rows. They ARE representable on the Package level via the
// existing infantRate / childWithoutBedRate fields (which seed.ts already uses
// for exactly this purpose), so they are stored there and NOT inserted into
// PackageRoomPrice. If a decision to model them per-room is made later, this
// script should be revisited.
// =============================================================================

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Minimal CSV reader (the project has no papaparse dependency; these CSVs are
// simple and well-formed, only the flight_groups column is double-quoted).
// ---------------------------------------------------------------------------
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function readCsv(fileName: string): { rows: Record<string, string>[]; comments: string[] } {
  const text = fs.readFileSync(path.join(__dirname, fileName), "utf8");
  const comments: string[] = [];
  const lines: string[][] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      comments.push(line);
      continue;
    }
    lines.push(splitCsvLine(line));
  }
  const header = lines[0];
  const rows = lines.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = r[i] ?? "";
    });
    return obj;
  });
  return { rows, comments };
}

const toNum = (s: string): number | null => {
  const t = s.trim().replace(/[, ]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const titleCase = (s: string): string =>
  s
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");

// ---------------------------------------------------------------------------
// Hotel resolution
// ---------------------------------------------------------------------------
// maps a flyer hotel label -> canonical existing hotel names to look up first
const HOTEL_ALIASES: Record<string, string[]> = {
  "Miad Al Majd": ["Miad Al Majid"],
  "Saif Al Majd": ["Saif Al Majid"],
  "Mayer Mayassar": ["Mayer Mayassar", "Mayar Moyasar", "Mayar Moyassar"],
  "Mayar Moyassar": ["Mayer Mayassar", "Mayar Moyasar", "Mayar Moyassar"],
  "Jaddat Al Khalil": ["Jaddat Al Khalil", "Jada Al Mashaer"],
  "Jada Al Khalil": ["Jaddat Al Khalil", "Jada Al Mashaer"],
  "Multaqa Al Ibadat": ["Multaqa Al Ibadat"],
  "Saif Al Majid": ["Saif Al Majid"],
  "Fundaq Al Aliya": ["Fundaq Al Aliya"],
  "Fundaq Dakhil (ex-Al Aliya)": ["Fundaq Al Aliya"],
  "Hibba Al Hijra 6": ["Hibba Al Hijra 6", "Hiba Al Hijra 6"],
  "Makarim Al Hijra": ["Makarim Al Hijra"],
  "Tara Al Yasmeen": ["Tara Al Yasmeen"],
  "Forsan Al Ghad": ["Forsan Al Ghad"],
  "Zahra Sita": ["Zahra Sita"],
  "Majd Al Fiddi": ["Majd Al Fiddi"],
};

type HotelRef = { id: string; name: string };

const SAUDIA_BAGGAGE = "30kg checked + 7kg hand luggage";

const SAUDIA_TERMS = [
  "Booking finalized after 100% advance payment",
  "Non-refundable & non-changeable after finalization",
  "Packages subject to change without prior notice",
  "Pakistan / Saudi rule changes may affect packages",
].join("\n");

// Flight groups transcribed verbatim from the written September 2026 Saudia flyer.
const FLIGHT_GROUPS: Record<number, Array<{ dep: string; ret: string }>> = {
  15: [
    { dep: "2026-09-17", ret: "2026-10-01" },
    { dep: "2026-09-27", ret: "2026-10-11" },
  ],
  21: [
    { dep: "2026-09-18", ret: "2026-10-08" },
    { dep: "2026-09-23", ret: "2026-10-13" },
    { dep: "2026-09-26", ret: "2026-10-16" },
    { dep: "2026-09-28", ret: "2026-10-18" },
  ],
};

// Nights exactly as written on the flyer rows (the Makkah split stays as-is).
const NIGHTS_LABELS: Record<number, { makkah: string; madinah: string }> = {
  15: { makkah: "5 + 3", madinah: "6" },
  21: { makkah: "6 + 6", madinah: "8" },
};

async function main() {
  console.log("Seeding Sep/Oct 2026 flyer packages...");

  // ---------- Room types (ensure the ones these flyers need exist) ----------
  const roomTypes = [
    { name: "Sharing", code: "SHR" },
    { name: "SHR/QUIN", code: "SHRQUIN" },
    { name: "Quint", code: "QUIN" },
    { name: "Quad", code: "QUAD" },
    { name: "Triple", code: "TRPL" },
    { name: "Double", code: "DBL" },
  ];
  const rtByName: Record<string, string> = {};
  for (const rt of roomTypes) {
    const created = await prisma.roomType.upsert({
      where: { name: rt.name },
      update: {},
      create: rt,
    });
    rtByName[rt.name] = created.id;
  }

  // ---------- Saudia airline (reuse the existing record; create only if missing) ----------
  const saudiAirline = await prisma.airline.findFirst({
    where: {
      OR: [
        { name: { equals: "Saudia", mode: "insensitive" } },
        { code: { equals: "SV", mode: "insensitive" } },
      ],
    },
  });
  let saudiaId: string;
  if (saudiAirline) {
    saudiaId = saudiAirline.id;
    console.log(`  airline: reused existing Saudia (${saudiAirline.name})`);
  } else {
    const created = await prisma.airline.create({
      data: {
        name: "Saudia",
        code: "SV",
        description: "Saudi Arabian Airlines - The national carrier of Saudi Arabia",
        baggageAllowance: SAUDIA_BAGGAGE,
        departureCity: "Islamabad",
        arrivalCity: "Jeddah",
      },
    });
    saudiaId = created.id;
    console.log("  airline: created Saudia (SV)");
  }

  const hotelCache = new Map<string, HotelRef>();
  const packageHotelCache = new Map<string, string>();

  async function getOrCreateHotel(
    key: string,
    city: "Makkah" | "Madinah",
    distanceNote: string
  ): Promise<HotelRef> {
    const cached = hotelCache.get(key);
    if (cached) return cached;
    const candidates = HOTEL_ALIASES[key] && HOTEL_ALIASES[key].length ? HOTEL_ALIASES[key] : [key];
    let existing: { id: string; name: string } | null = null;
    for (const cand of candidates) {
      existing = await prisma.hotel.findFirst({
        where: { name: { equals: cand, mode: "insensitive" } },
      });
      if (existing) break;
    }
    let ref: HotelRef;
    if (existing) {
      ref = { id: existing.id, name: existing.name };
    } else {
      const created = await prisma.hotel.create({
        data: {
          name: key,
          city,
          distanceFromHaram: city === "Makkah" ? distanceNote || null : null,
          distanceFromMasjidNabawi: city === "Madinah" ? distanceNote || null : null,
          category: "STANDARD",
          shuttleAvailable: /shuttle/i.test(distanceNote),
        },
      });
      ref = { id: created.id, name: created.name };
    }
    hotelCache.set(key, ref);
    return ref;
  }

  async function getOrCreatePackageHotel(
    hotelId: string,
    distanceNote: string | null,
    location?: string | null
  ): Promise<string> {
    const cached = packageHotelCache.get(hotelId);
    if (cached) return cached;
    let ph = await prisma.packageHotel.findFirst({ where: { hotelId } });
    if (!ph) {
      ph = await prisma.packageHotel.create({
        data: {
          hotelId,
          distance: distanceNote || undefined,
          location: location || undefined,
        },
      });
    }
    packageHotelCache.set(hotelId, ph.id);
    return ph.id;
  }

  // ---------- Package / price upsert helpers ----------
  const entriesFor = (row: Record<string, string>, spec: Array<[string, string]>) => {
    const entries: Array<{ roomType: string; price: number }> = [];
    for (const [col, roomType] of spec) {
      const p = toNum(row[col] ?? "");
      if (p === null) continue; // empty price cell => not offered, skip entirely
      entries.push({ roomType, price: p });
    }
    return entries;
  };

  const upsertRoomPrices = async (packageId: string, entries: Array<{ roomType: string; price: number }>) => {
    for (const e of entries) {
      const roomTypeId = rtByName[e.roomType];
      if (!roomTypeId) continue;
      await prisma.packageRoomPrice.upsert({
        where: { packageId_roomTypeId: { packageId, roomTypeId } },
        update: { price: e.price, currency: "PKR", available: true },
        create: { packageId, roomTypeId, price: e.price, currency: "PKR", available: true },
      });
    }
  };

  let nextSortOrder = 200; // leave the 1..58 range already used by seed.ts untouched
  let packagesUpserted = 0;

  // ===========================================================================
  // Flyer 1 - Saudia 15 & 21 Days (20 packages)
  // ===========================================================================
  const flyer1 = readCsv("flyer1_saudia_15_21days.csv");
  const flyer1Spec: Array<[string, string]> = [
    ["sharing_pkr", "Sharing"],
    ["quad_pkr", "Quad"],
    ["triple_pkr", "Triple"],
    ["double_pkr", "Double"],
  ];

  for (const row of flyer1.rows) {
    const dur = Number(row.duration_days);
    if (!Number.isFinite(dur)) continue;
    const makkahKey = titleCase(row.makkah_hotel);
    const madinahKey = titleCase(row.madinah_hotel);
    const mNote = row.makkah_distance_notes.trim();
    const dNote = row.madinah_distance_notes.trim();

    const makkah = await getOrCreateHotel(makkahKey, "Makkah", mNote);
    const madinah = await getOrCreateHotel(madinahKey, "Madinah", dNote);
    const makkahPhId = await getOrCreatePackageHotel(makkah.id, mNote);
    const madinahPhId = await getOrCreatePackageHotel(madinah.id, dNote);

    const packageCode = `SAUDIA15-P${row.pkg_no}-${dur}D`;
    const pkgNo = row.pkg_no.trim().padStart(2, "0");
    const title = `${dur} Days Package ${pkgNo}`;
    const groups = FLIGHT_GROUPS[dur] ?? [];
    const depDates = groups.map((g) => g.dep).join(", ");
    const retDates = groups.map((g) => g.ret).join(", ");
    const nights = NIGHTS_LABELS[dur] ?? NIGHTS_LABELS[15];
    const data = {
      title,
      durationDays: dur,
      status: PackageStatus.ACTIVE,
      description: `${makkah.name} in Makkah (${mNote}). ${madinah.name} in Madinah (${dNote}). ${dur}-day Umrah package from Islamabad to Jeddah with Saudia direct flights. Makkah ${nights.makkah} nights, Madinah ${nights.madinah} nights.`,
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
      airlineId: saudiaId,
      departureDate: groups.length ? new Date(`${groups[0].dep}T00:00:00.000Z`) : null,
      returnDate: groups.length ? new Date(`${groups[0].ret}T00:00:00.000Z`) : null,
      departureDates: depDates || row.flight_groups,
      returnDates: retDates || null,
      baggageDetails: SAUDIA_BAGGAGE,
      termsAndConditions: SAUDIA_TERMS,
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
      guideIncluded: false,
      ziyaratIncluded: false,
      sortOrder: nextSortOrder,
      makkahHotelId: makkahPhId,
      makkahNights: Number(row.makkah_nights),
      makkahDistance: mNote,
      madinahHotelId: madinahPhId,
      madinahNights: Number(row.madinah_nights),
      madinahDistance: dNote,
    };
    nextSortOrder += 1;

    const pkg = await prisma.package.upsert({
      where: { packageCode },
      update: data,
      create: { ...data, packageCode },
    });
    await upsertRoomPrices(pkg.id, entriesFor(row, flyer1Spec));
    packagesUpserted += 1;
    console.log(`  flyer1: ${packageCode} (${title})`);
  }

  // ----- FlightSchedule records for the Saudia September 2026 groups -----
  // 2 groups for 15-day, 4 groups for 21-day, all linked to the reused SAUDIA
  // airline. FlightSchedule has no natural unique key, so look up by
  // (airlineId + departureDate + returnDate) to stay idempotent.
  let schedulesEnsured = 0;
  for (const groups of Object.values(FLIGHT_GROUPS)) {
    for (const g of groups) {
      const dep = new Date(`${g.dep}T00:00:00.000Z`);
      const ret = new Date(`${g.ret}T00:00:00.000Z`);
      const existing = await prisma.flightSchedule.findFirst({
        where: { airlineId: saudiaId, departureDate: dep, returnDate: ret },
      });
      if (existing) continue;
      await prisma.flightSchedule.create({
        data: {
          airlineId: saudiaId,
          departureCity: "Islamabad",
          arrivalCity: "Jeddah",
          departureDate: dep,
          returnDate: ret,
          baggageDetails: SAUDIA_BAGGAGE,
          status: "active",
        },
      });
      schedulesEnsured += 1;
    }
  }
  console.log(
    `  flight schedules: Saudia ${FLIGHT_GROUPS[15].length} groups (15d) + ${FLIGHT_GROUPS[21].length} groups (21d), created ${schedulesEnsured} new`
  );

  // ===========================================================================
  // Flyer 2 - 21 Days "Spiritual Journey" (4 packages)
  // ===========================================================================
  const flyer2 = readCsv("flyer2_21days_spiritual_journey.csv");
  const flyer2Spec: Array<[string, string]> = [
    ["sharing_pkr", "Sharing"],
    ["quad_pkr", "Quad"],
    ["triple_pkr", "Triple"],
    ["double_pkr", "Double"],
  ];

  // Assemble the flight reference block stored in the CSV's trailing comments
  // (AIRSIAL / SAUDIA / PIA departure-return lines only; infant/child and
  // header lines are excluded).
  const flyer2Flight = flyer2.comments
    .map((c) => c.replace(/^#\s*/, "").trim())
    .filter((c) => c.length > 0)
    .filter((c) => !/^Flight dates\b/i.test(c))
    .filter((c) => !/^Infant/i.test(c) && !/^Child/i.test(c))
    .join(" | ");

  const baseNameFlyer2 = (full: string): string => {
    const first = full.split("/")[0].trim().replace(/\s*\([^)]*\)\s*$/, "").trim();
    return first.replace(/\s+\d+M[^)]*$/i, "").trim();
  };

  const noteFlyer2 = (full: string): string => {
    const first = full.split("/")[0].trim();
    const tail = first.match(/([\d.]+\s*M.*)$/i);
    if (tail) return tail[1].trim();
    const paren = first.match(/\(([^)]*)\)/);
    if (paren) return paren[1].trim();
    return "";
  };

  for (const row of flyer2.rows) {
    const dur = Number(row.duration_days);
    if (!Number.isFinite(dur)) continue;

    const makkahKey = baseNameFlyer2(row.makkah_hotel);
    const madinahKey = "Fundaq Dakhil (ex-Al Aliya)";
    const nameKey = row.pkg_name.trim();
    const codeSuffix = /^BUDGET$/i.test(nameKey) ? "BUD" : nameKey.replace(/^PACKAGE\s+/i, "").trim();

    const makkah = await getOrCreateHotel(makkahKey, "Makkah", noteFlyer2(row.makkah_hotel));
    const madinah = await getOrCreateHotel(madinahKey, "Madinah", noteFlyer2(row.madinah_hotel));
    const makkahPhId = await getOrCreatePackageHotel(makkah.id, noteFlyer2(row.makkah_hotel));
    const madinahPhId = await getOrCreatePackageHotel(
      madinah.id,
      noteFlyer2(row.madinah_hotel),
      row.madinah_location_note || null
    );

    const mNote = noteFlyer2(row.makkah_hotel);
    const madinahNote = [noteFlyer2(row.madinah_hotel), row.madinah_location_note]
      .filter(Boolean)
      .join(" ")
      .trim();
    const packageCode = `SPIRIT21-${codeSuffix}`;
    const title = `21 Days Umrah - ${codeSuffix === "BUD" ? "Budget" : `Package ${codeSuffix}`}`;
    const data = {
      title,
      durationDays: dur,
      status: PackageStatus.ACTIVE,
      description: `${makkah.name} in Makkah (${mNote || "na"}). ${madinah.name} in Madinah (${madinahNote || "na"}). ${dur}-day Umrah package from Islamabad to Jeddah.`,
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
      departureDates: flyer2Flight,
      returnDates: null,
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
      guideIncluded: false,
      ziyaratIncluded: false,
      // Flat rates from the flyer comments; see the header note for the schema
      // decision. NOT inserted into PackageRoomPrice.
      infantRate: 95000,
      childWithoutBedRate: 200000,
      sortOrder: nextSortOrder,
      makkahHotelId: makkahPhId,
      makkahNights: Number(row.makkah_nights),
      makkahDistance: mNote || null,
      madinahHotelId: madinahPhId,
      madinahNights: Number(row.madinah_nights),
      madinahDistance: madinahNote || null,
    };
    nextSortOrder += 1;

    const pkg = await prisma.package.upsert({
      where: { packageCode },
      update: data,
      create: { ...data, packageCode },
    });
    await upsertRoomPrices(pkg.id, entriesFor(row, flyer2Spec));
    packagesUpserted += 1;
    console.log(`  flyer2: ${packageCode} (${title})`);
  }

  // ===========================================================================
  // Flyer 3 - Umrah Packages Sep & Oct 2026 (7 categories x 14d/22d = 14)
  // ===========================================================================
  const flyer3 = readCsv("flyer3_sep_oct_2026.csv");
  const flyer3Spec: Array<[string, string]> = [
    ["sharing_quin_pkr", "SHR/QUIN"], // the flyer's combined "Sharing/Quin" column;
    // seed.ts already models this exact column as the "SHR/QUIN" room type
    ["quad_pkr", "Quad"],
    ["triple_pkr", "Triple"],
    ["double_pkr", "Double"],
  ];

  const baseNameFlyer3 = (full: string): string =>
    full.split(" or ")[0].trim().replace(/\s*\([^)]*\)\s*$/, "").trim();

  const noteFlyer3 = (full: string): string => {
    const m = full.match(/\(([^)]*(?:MTR|mtr|m)[^)]*)\)/i);
    return m ? m[1].trim() : "";
  };

  const flightLineFor = (dur: number): string => {
    const line = flyer3.comments
      .map((c) => c.replace(/^#\s*/, "").trim())
      .find((c) => c.startsWith(`${dur} DAYS`));
    return line ?? "";
  };

  for (const row of flyer3.rows) {
    const dur = Number(row.duration_days);
    if (!Number.isFinite(dur)) continue;
    if (![14, 22].includes(dur)) continue; // CSV only carries 14 & 22-day rows

    const makkahKey = baseNameFlyer3(row.makkah_hotel);
    const madinahKey = baseNameFlyer3(row.madinah_hotel);
    const mNote = noteFlyer3(row.makkah_hotel);
    const madinahArea = row.madinah_distance_area.trim();
    const dNote = [noteFlyer3(row.madinah_hotel), madinahArea].filter(Boolean).join(" ").trim();

    const makkah = await getOrCreateHotel(makkahKey, "Makkah", mNote);
    const madinah = await getOrCreateHotel(madinahKey, "Madinah", dNote);
    const makkahPhId = await getOrCreatePackageHotel(makkah.id, mNote);
    const madinahPhId = await getOrCreatePackageHotel(madinah.id, dNote || null);

    // Nights come from the CSV's trailing comment block:
    // 14 days = Makkah 9 / Madinah 5; 22 days = Makkah 15 / Madinah 6
    const nights = dur === 14 ? { m: 9, d: 5 } : { m: 15, d: 6 };

    const packageCode = `SEPOCT-CAT${row.category_no}-${dur}D`;
    const title = `${makkah.name} + ${madinah.name} - ${dur} Days`;
    const data = {
      title,
      durationDays: dur,
      status: PackageStatus.ACTIVE,
      description: `${makkah.name} in Makkah (${mNote || "na"}). ${madinah.name} in Madinah (${dNote || "na"}). ${dur}-day Umrah package from Islamabad to Jeddah.`,
      departureCity: "Islamabad",
      arrivalCity: "Jeddah",
      departureDates: flightLineFor(dur) || null,
      returnDates: null,
      visaIncluded: true,
      ticketIncluded: true,
      hotelIncluded: true,
      transportIncluded: true,
      guideIncluded: false,
      ziyaratIncluded: false,
      sortOrder: nextSortOrder,
      makkahHotelId: makkahPhId,
      makkahNights: nights.m,
      makkahDistance: mNote || null,
      madinahHotelId: madinahPhId,
      madinahNights: nights.d,
      madinahDistance: dNote || null,
    };
    nextSortOrder += 1;

    const pkg = await prisma.package.upsert({
      where: { packageCode },
      update: data,
      create: { ...data, packageCode },
    });
    await upsertRoomPrices(pkg.id, entriesFor(row, flyer3Spec));
    packagesUpserted += 1;
    console.log(`  flyer3: ${packageCode} (${title})`);
  }

  console.log(`Flyer seed complete: ${packagesUpserted} packages upserted.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });