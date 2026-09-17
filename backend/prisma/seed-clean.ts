import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.auditLog.deleteMany();
  await prisma.bookingInquiry.deleteMany();
  await prisma.packageRoomPrice.deleteMany();
  await prisma.packageHotel.deleteMany();
  await prisma.package.deleteMany();
  await prisma.flightSchedule.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminUser.deleteMany();
  console.log("Database cleaned. Run `npm run db:seed` to reseed.");
}

main()
  .catch((e) => {
    console.error("Clean error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });