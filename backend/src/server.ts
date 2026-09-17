import { app } from "./app";
import { config } from "./config";
import { prisma } from "./config/prisma";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

async function main() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(config.port, () => {
      console.log(`MS Sons Tours API running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  const { closeRedis } = await import("./config/redis");
  const { closeKafka } = await import("./config/kafka");
  await prisma.$disconnect();
  await closeRedis();
  await closeKafka();
  process.exit(0);
});

main();