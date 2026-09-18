import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { cache } from "../cache";

function parseDateList(list?: string | null): string[] {
  if (!list) return [];
  return list
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isExpired(dateStr: string, today: Date): boolean {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).getTime() < today.getTime();
}

// Removes passed departure dates from packages that still have future dates and
// deletes packages whose only departure date has passed. Runs on a daily basis.
export async function cleanupExpiredPackages(): Promise<{ pruned: number; deleted: number }> {
  const today = startOfToday();

  console.log("[cleanup] cleanupExpiredPackages() STARTED at", new Date().toISOString());
  console.log("[cleanup] today (startOfToday) =>", today.toString(), "|", today.toISOString());

  const packages = await prisma.package.findMany({
    select: {
      id: true,
      departureDates: true,
      returnDates: true,
      departureDate: true,
    },
  });
  console.log(`[cleanup] loaded ${packages.length} package(s) for inspection`);

  const deleteIds: string[] = [];
  const updates: { id: string; data: Prisma.PackageUpdateInput }[] = [];

  for (const pkg of packages) {
    const departures = parseDateList(pkg.departureDates);

    const rawDateIso = pkg.departureDate ? pkg.departureDate.toISOString() : null;
    if ((pkg.departureDates || "").includes("2026-09-10") || (rawDateIso || "").startsWith("2026-09-10")) {
      console.log(
        "[cleanup] Sep-10 package raw DB values:",
        JSON.stringify({
          id: pkg.id,
          departureDate: pkg.departureDate,
          typeofDepartureDate: typeof pkg.departureDate,
          departureDates: pkg.departureDates,
          returnDates: pkg.returnDates,
        })
      );
    }

    // No comma-separated list: fall back to the legacy single DateTime.
    if (departures.length === 0) {
      if (pkg.departureDate && pkg.departureDate.getTime() < today.getTime()) {
        console.log(
          "[cleanup] DELETE candidate (single departureDate):",
          JSON.stringify({ id: pkg.id, departureDate: pkg.departureDate, departureDates: pkg.departureDates, today: today.toISOString() })
        );
        deleteIds.push(pkg.id);
      }
      continue;
    }

    const returns = parseDateList(pkg.returnDates);
    const keptDepartures: string[] = [];
    const keptReturns: string[] = [];

    departures.forEach((dateStr, index) => {
      if (!isExpired(dateStr, today)) {
        keptDepartures.push(dateStr);
        if (returns[index]) keptReturns.push(returns[index]);
      }
    });

    // Nothing expired in this package.
    if (keptDepartures.length === departures.length) continue;

    // Every departure date has passed: remove the whole package.
    if (keptDepartures.length === 0) {
      console.log(
        "[cleanup] DELETE candidate (all list dates expired):",
        JSON.stringify({ id: pkg.id, departureDates: pkg.departureDates, returnDates: pkg.returnDates, today: today.toISOString() })
      );
      deleteIds.push(pkg.id);
      continue;
    }

    updates.push({
      id: pkg.id,
      data: {
        departureDates: keptDepartures.join(", "),
        returnDates: keptReturns.length > 0 ? keptReturns.join(", ") : null,
      },
    });
  }

  console.log(`[cleanup] plan: ${updates.length} update(s), ${deleteIds.length} delete(s)`);

  if (updates.length > 0) {
    for (const upd of updates) {
      console.log("[cleanup] UPDATE package:", JSON.stringify(upd));
      await prisma.package.update({ where: { id: upd.id }, data: upd.data });
    }
  }

  if (deleteIds.length > 0) {
    console.log("[cleanup] DELETE packages:", JSON.stringify(deleteIds));
    await prisma.package.deleteMany({ where: { id: { in: deleteIds } } });
  }

  if (updates.length > 0 || deleteIds.length > 0) {
    await cache.invalidatePackages();
  }

  return { pruned: updates.length, deleted: deleteIds.length };
}

const DAILY_RUN_HOUR = 0;
const DAILY_RUN_MINUTE = 1;

// Runs the cleanup once at startup and then daily just after midnight. Uses a
// plain setTimeout instead of a cron library to avoid adding a dependency.
export function startDailyCleanupScheduler(): void {
  const runCleanup = () => {
    cleanupExpiredPackages()
      .then(({ pruned, deleted }) => {
        if (pruned > 0 || deleted > 0) {
          console.log(`[cleanup] Expired departure dates: pruned ${pruned}, deleted ${deleted} package(s)`);
        }
      })
      .catch((err) => {
        console.error("[cleanup] Expired departure date cleanup failed:", err);
      });
  };

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      DAILY_RUN_HOUR,
      DAILY_RUN_MINUTE,
      0,
      0
    );
    const delay = Math.max(next.getTime() - now.getTime(), 60_000);
    setTimeout(() => {
      runCleanup();
      scheduleNext();
    }, delay);
  };

  runCleanup();
  scheduleNext();
}