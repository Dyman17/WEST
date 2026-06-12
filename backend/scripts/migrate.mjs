import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
const hasValidDatabaseUrl = /^postgres(ql)?:\/\//i.test(databaseUrl ?? "");

if (!hasValidDatabaseUrl) {
  console.error("DATABASE_URL must be a valid postgres connection string for migrations.");
  process.exit(1);
}

const currentFile = fileURLToPath(import.meta.url);
const backendRoot = path.resolve(path.dirname(currentFile), "..");
const schemaFile = path.join(backendRoot, "supabase", "schema.sql");
const sql = fs.readFileSync(schemaFile, "utf8");

const statements = sql
  .split(";")
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0 && !statement.startsWith("--"));

const pool = new Pool({ connectionString: databaseUrl });

try {
  for (const statement of statements) {
    await pool.query(statement);
  }
  console.log(`Migrated WEST schema from ${schemaFile}`);
} catch (error) {
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
