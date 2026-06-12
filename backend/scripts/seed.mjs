import { buildSeedStore, persistStore } from "../src/storage.js";

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is required for seeding PostgreSQL.");
  process.exit(1);
}

try {
  await persistStore(buildSeedStore());
  console.log("Seed data written to PostgreSQL.");
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
}
