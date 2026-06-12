if (process.env.DATABASE_URL?.trim()) {
  await import("./migrate.mjs");
}

await import("../src/server.js");
