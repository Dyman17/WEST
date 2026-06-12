import { Pool } from "pg";
import {
  seedAiAnalyses,
  seedAiPrompts,
  seedBookings,
  seedDrivers,
  seedFreights,
  seedLessons,
  seedPorts,
  seedRatingRules,
  seedTrajectories,
  seedUsers,
} from "./data.js";

const DATABASE_URL = process.env.DATABASE_URL?.trim() ?? "";
const allowedAccountRoles = new Set(["admin", "shipper", "carrier"]);

let pool;

function getPool() {
  if (!DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL });
  }
  return pool;
}

export function buildSeedStore() {
  return {
    users: seedUsers.map((entry) => ({ ...entry })),
    drivers: seedDrivers.map((entry) => ({ ...entry })),
    freights: seedFreights.map((entry) => ({ ...entry })),
    ports: seedPorts.map((entry) => ({ ...entry })),
    bookings: seedBookings.map((entry) => ({ ...entry })),
    lessons: seedLessons.map((entry) => ({ ...entry })),
    trajectories: seedTrajectories.map((entry) => ({ ...entry })),
    ratingRules: seedRatingRules.map((entry) => ({ ...entry })),
    aiPrompts: seedAiPrompts.map((entry) => ({ ...entry })),
    aiAnalyses: seedAiAnalyses.map((entry) => ({ ...entry })),
    freightDecisions: [],
  };
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAccountRole(role) {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (allowedAccountRoles.has(normalized)) return normalized;
  return "carrier";
}

function capabilitiesForRole(role) {
  if (role === "admin") return ["manage_all", "view_dashboard", "manage_users"];
  if (role === "shipper") return ["create_orders", "choose_driver", "book_port", "track_cargo"];
  return ["browse_loads", "accept_loads", "book_port", "view_routes"];
}

function mapUserRow(row) {
  const role = normalizeAccountRole(row.role);
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name ?? row.full_name,
    role,
    password: row.password ?? "",
    company: row.company ?? row.company_name ?? "",
    capabilities: ensureArray(row.capabilities).length > 0 ? ensureArray(row.capabilities) : capabilitiesForRole(role),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function mapDriverRow(row) {
  return {
    id: row.id,
    name: row.name,
    transportType: row.transport_type,
    rating: Number(row.rating ?? 0),
    score: Number(row.score ?? 0),
    trips: Number(row.trips ?? 0),
    eco: Number(row.eco ?? 0),
    delays: Number(row.delays ?? 0),
    cancels: Number(row.cancels ?? 0),
    homeBase: row.home_base,
    routes: ensureArray(row.routes),
    hourlyRate: Number(row.hourly_rate ?? 0),
    pricePerKm: Number(row.price_per_km ?? 0),
    available: Boolean(row.available),
    status: row.status ?? "online",
  };
}

function mapFreightRow(row) {
  return {
    id: row.id,
    from: row.from,
    to: row.to,
    weight: Number(row.weight ?? 0),
    type: row.type,
    price: Number(row.price ?? 0),
    shipper: row.shipper,
    rating: Number(row.rating ?? 0),
    eco: Boolean(row.eco),
    distance: Number(row.distance ?? 0),
    transportType: row.transport_type,
    status: row.status ?? "open",
    priority: Number(row.priority ?? 0),
    deadline: row.deadline,
  };
}

function mapPortRow(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    kind: row.kind,
    load: Number(row.load ?? 0),
    status: row.status ?? "free",
    capacityPerDay: row.capacity_per_day ?? row.capacityPerDay ?? 40,
    timezone: row.timezone ?? "Asia/Qyzylorda",
    latitude: row.latitude ?? row.lat ?? null,
    longitude: row.longitude ?? row.lng ?? null,
  };
}

function mapBookingRow(row) {
  return {
    id: row.id,
    portId: row.port_id,
    userId: row.user_id,
    date: row.date,
    slot: row.slot,
    purpose: row.purpose,
    status: row.status ?? "confirmed",
  };
}

function mapLessonRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: Number(row.duration_minutes ?? 0),
    language: row.language,
    stage: Number(row.stage ?? 0),
  };
}

function mapTrajectoryRow(row) {
  return {
    id: row.id,
    from: row.from,
    to: row.to,
    mode: row.mode,
    status: row.status,
    load: Number(row.load ?? 0),
    distance: Number(row.distance ?? 0),
    congestion: row.congestion,
    note: row.note,
  };
}

function mapRatingRuleRow(row) {
  return {
    key: row.key,
    label: row.label,
    weight: Number(row.weight ?? 0),
    source: row.source,
  };
}

function mapAiPromptRow(row) {
  return {
    key: row.key,
    title: row.title,
    category: row.category,
    description: row.description,
    template: row.template,
    instructions: row.instructions,
    model: row.model ?? "o4-mini",
    active: row.active ?? true,
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
  };
}

function mapAiAnalysisRow(row) {
  return {
    id: row.id,
    promptKey: row.prompt_key ?? row.promptKey,
    entityType: row.entity_type ?? row.entityType,
    entityId: row.entity_id ?? row.entityId,
    input: row.input_json ?? row.input ?? {},
    summary: row.summary,
    bullets: ensureArray(row.bullets),
    source: row.source ?? "mock",
    model: row.model ?? "o4-mini",
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function mapDecisionRow(row) {
  return {
    id: row.id,
    freightId: row.freight_id,
    userId: row.user_id,
    decision: row.decision,
    createdAt: row.created_at,
  };
}

async function loadFromPostgres() {
  const client = getPool();
  if (!client) return buildSeedStore();

  const [{ rows: userRows }, { rows: driverRows }, { rows: freightRows }, { rows: portRows }, { rows: bookingRows }, { rows: lessonRows }, { rows: trajectoryRows }, { rows: ruleRows }, { rows: promptRows }, { rows: analysisRows }, { rows: decisionRows }] = await Promise.all([
    client.query("SELECT * FROM users ORDER BY created_at ASC"),
    client.query("SELECT * FROM drivers ORDER BY score DESC"),
    client.query("SELECT * FROM freights ORDER BY priority DESC"),
    client.query("SELECT * FROM ports ORDER BY id ASC"),
    client.query("SELECT * FROM bookings ORDER BY created_at ASC"),
    client.query("SELECT * FROM lessons ORDER BY stage ASC"),
    client.query("SELECT * FROM trajectories ORDER BY id ASC"),
    client.query("SELECT * FROM rating_rules ORDER BY key ASC"),
    client.query("SELECT * FROM ai_prompts ORDER BY key ASC"),
    client.query("SELECT * FROM ai_analyses ORDER BY created_at DESC"),
    client.query("SELECT * FROM freight_decisions ORDER BY created_at ASC"),
  ]);

  if (userRows.length === 0 || promptRows.length === 0) {
    const seedStore = buildSeedStore();
    await persistToPostgres(seedStore);
    return seedStore;
  }

  return {
    users: userRows.map(mapUserRow),
    drivers: driverRows.map(mapDriverRow),
    freights: freightRows.map(mapFreightRow),
    ports: portRows.map(mapPortRow),
    bookings: bookingRows.map(mapBookingRow),
    lessons: lessonRows.map(mapLessonRow),
    trajectories: trajectoryRows.map(mapTrajectoryRow),
    ratingRules: ruleRows.map(mapRatingRuleRow),
    aiPrompts: promptRows.map(mapAiPromptRow),
    aiAnalyses: analysisRows.map(mapAiAnalysisRow),
    freightDecisions: decisionRows.map(mapDecisionRow),
  };
}

async function insertRows(client, table, columns, rows) {
  for (const row of rows) {
    const values = columns.map((column) => row[column]);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
    await client.query(`INSERT INTO "${table}" (${quotedColumns}) VALUES (${placeholders})`, values);
  }
}

async function persistToPostgres(store) {
  const client = getPool();
  if (!client) return;

  await client.query("BEGIN");
  try {
    await client.query(`
      TRUNCATE TABLE
        ai_analyses,
        ai_prompts,
        freight_decisions,
        bookings,
        trajectories,
        lessons,
        rating_rules,
        freights,
        drivers,
        ports,
        users
      RESTART IDENTITY CASCADE
    `);

    await insertRows(client, "users", ["id", "username", "email", "name", "role", "password", "company", "capabilities", "created_at"], store.users.map((user) => ({
      ...user,
      created_at: user.createdAt ?? new Date().toISOString(),
    })));
    await insertRows(client, "ports", ["id", "name", "city", "kind", "load", "status"], store.ports);
    await insertRows(client, "drivers", ["id", "name", "transport_type", "rating", "score", "trips", "eco", "delays", "cancels", "home_base", "routes", "hourly_rate", "price_per_km", "available", "status"], store.drivers.map((driver) => ({
      ...driver,
      transport_type: driver.transportType,
      home_base: driver.homeBase,
      hourly_rate: driver.hourlyRate,
      price_per_km: driver.pricePerKm,
    })));
    await insertRows(client, "freights", ["id", "from", "to", "weight", "type", "price", "shipper", "rating", "eco", "distance", "transport_type", "status", "priority", "deadline"], store.freights.map((freight) => ({
      ...freight,
      transport_type: freight.transportType,
    })));
    await insertRows(client, "lessons", ["id", "title", "description", "duration_minutes", "language", "stage"], store.lessons.map((lesson) => ({
      ...lesson,
      duration_minutes: lesson.durationMinutes,
    })));
    await insertRows(client, "trajectories", ["id", "from", "to", "mode", "status", "load", "distance", "congestion", "note"], store.trajectories);
    await insertRows(client, "rating_rules", ["key", "label", "weight", "source"], store.ratingRules);
    await insertRows(client, "ai_prompts", ["key", "title", "category", "description", "template", "instructions", "model", "active", "updated_at"], store.aiPrompts.map((prompt) => ({
      ...prompt,
      updated_at: prompt.updatedAt ?? new Date().toISOString(),
    })));
    await insertRows(client, "ai_analyses", ["id", "prompt_key", "entity_type", "entity_id", "input_json", "summary", "bullets", "source", "model", "created_at"], store.aiAnalyses.map((analysis) => ({
      ...analysis,
      prompt_key: analysis.promptKey,
      entity_type: analysis.entityType,
      entity_id: analysis.entityId,
      input_json: analysis.input,
      created_at: analysis.createdAt,
    })));
    await insertRows(client, "bookings", ["id", "port_id", "user_id", "date", "slot", "purpose", "status"], store.bookings.map((booking) => ({
      ...booking,
      port_id: booking.portId,
      user_id: booking.userId,
    })));
    await insertRows(client, "freight_decisions", ["id", "freight_id", "user_id", "decision", "created_at"], store.freightDecisions.map((decision) => ({
      ...decision,
      freight_id: decision.freightId,
      user_id: decision.userId,
      created_at: decision.createdAt,
    })));

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function loadStore() {
  return loadFromPostgres();
}

export async function persistStore(store) {
  return persistToPostgres(store);
}
