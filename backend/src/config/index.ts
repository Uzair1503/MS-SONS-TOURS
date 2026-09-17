import dotenv from "dotenv";
dotenv.config();

// Placeholder values that must never be used to sign tokens in production.
// The backend intentionally refuses to start with any of them so a missing
// or unset JWT_SECRET can never silently degrade security. Keep this list in
// sync with the examples in .env.example (root) and backend/.env.example.
const INSECURE_JWT_SECRETS = new Set([
  "change-this-in-production", // docker-compose.yml fallback placeholder
  "change-this-to-a-strong-random-secret-in-production", // backend/.env.example
]);

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret =
  process.env.JWT_SECRET ||
  (nodeEnv === "production" ? "change-this-in-production" : "fallback-secret-change-me");

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv,
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  siteUrl: process.env.SITE_URL || "https://www.mssons.com",
  whatsappNumber: process.env.WHATSAPP_NUMBER || "923713011519",
};

if (nodeEnv === "production" && (!jwtSecret || INSECURE_JWT_SECRETS.has(jwtSecret))) {
  console.error(
    [
      "FATAL: JWT_SECRET is missing or set to an insecure placeholder value while NODE_ENV=production.",
      "",
      "MS Sons Tours intentionally refuses to start - a placeholder/empty JWT_SECRET would sign",
      "admin tokens with a publicly known value and defeat authentication.",
      "",
      "How to fix:",
      "  1. Create a .env file at the PROJECT ROOT (next to docker-compose.yml) from the template:",
      '       cp .env.example .env',
      "  2. Generate a strong random secret:",
      '       openssl rand -base64 48',
      "  3. Paste the output into the root .env file as:",
      "       JWT_SECRET=<generated value>",
      "  4. Restart the stack (docker compose config fails fast until this is set):",
      "       docker compose up -d --build",
      "",
      "The root .env is git-ignored, so the real secret is never committed.",
    ].join("\n"),
  );
  throw new Error(
    "config: JWT_SECRET must be set to a strong random value in production (see log above for instructions)",
  );
}