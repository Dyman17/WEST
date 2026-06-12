const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
const hasValidDatabaseUrl = /^postgres(ql)?:\/\//i.test(databaseUrl);

if (hasValidDatabaseUrl) {
  await import("./migrate.mjs");
}

await import("../src/server.js");
