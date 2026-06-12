const DEFAULT_BACKEND_URL = "https://west-rt9s.onrender.com";
const TOKEN_KEY = "west-auth-token";

export const BACKEND_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_BACKEND_URL
).replace(/\/+$/, "");

export type BackendUserRole =
  | "admin"
  | "shipper"
  | "carrier";

export interface BackendUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: BackendUserRole;
  company?: string;
  capabilities?: string[];
  createdAt?: string;
}

export interface BackendAuthResponse {
  token: string;
  user: BackendUser;
}

export interface BackendDriver {
  id: string;
  name: string;
  transportType: "truck" | "ship" | "rail" | string;
  rating: number;
  score: number;
  trips: number;
  eco: number;
  delays: number;
  cancels: number;
  homeBase: string;
  routes: string[];
  hourlyRate: number;
  pricePerKm: number;
  available: boolean;
  status: string;
  match?: {
    score: number;
    reasons: string[];
  };
}

export interface BackendFreight {
  id: string;
  from: string;
  to: string;
  weight: number;
  type: string;
  price: number;
  shipper: string;
  rating: number;
  eco: boolean;
  distance: number;
  transportType: "truck" | "ship" | "rail" | string;
  status: string;
  priority: number;
  deadline: string;
  match?: {
    score: number;
    reasons: string[];
  };
}

export interface BackendFreightCreatePayload {
  from: string;
  to: string;
  weight: number | string;
  type: string;
  price?: number | string;
  transportType: string;
  eco?: boolean;
  deadline?: string;
  distance?: number | string;
  priority?: number | string;
}

export interface BackendPort {
  id: string;
  name: string;
  city: string;
  kind: string;
  load: number;
  status?: "free" | "medium" | "busy";
  bookedSlots?: number;
  availableSlots?: number;
  capacityPerDay?: number;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export interface BackendBooking {
  id: string;
  portId: string;
  userId: string;
  date: string;
  slot: string;
  purpose: string;
  status: string;
  port?: { id: string; name: string; city: string } | null;
  user?: BackendUser | null;
}

export interface BackendLesson {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  language: string;
  stage: number;
}

export interface BackendRatingRule {
  key: string;
  label: string;
  weight: number;
  source: string;
}

export interface BackendRatingItem {
  id: string;
  name: string;
  transportType: string;
  score: number;
  rating: number;
  trips: number;
  eco: number;
  penalties: { delays: number; cancellations: number };
  quality: number;
}

export interface BackendTrajectory {
  id: string;
  from: string;
  to: string;
  mode: string;
  status: string;
  load: number;
  distance: number;
  congestion: string;
  note: string;
}

export interface BackendDashboard {
  generatedAt: string;
  metrics: {
    activeUsers: number;
    openFreights: number;
    confirmedBookings: number;
    busyPorts: number;
    averageDriverScore: number;
    averageDriverRating: number;
    ecoFreightShare: number;
    estimatedMonthlyRevenueKzt: number;
  };
  topRoutes: Array<{
    route: string;
    price: number;
    status: string;
    transportType: string;
  }>;
  monthlySeries?: Array<{
    month: string;
    trucks: number;
    ships: number;
    trains: number;
    revenue: number;
  }>;
}

export interface BackendAiPrompt {
  key: string;
  title: string;
  category: string;
  description: string;
  template: string;
  instructions: string;
  model: string;
  active: boolean;
  updatedAt: string;
}

export interface BackendAiAnalysis {
  id: string;
  promptKey: string;
  entityType: string;
  entityId: string;
  input: Record<string, unknown>;
  summary: string;
  bullets: string[];
  source: string;
  model: string;
  createdAt: string;
}

export interface BackendAiForecastResponse {
  analysis: BackendAiAnalysis;
  forecast: {
    locationId: string;
    locationName: string;
    currentLoad: number;
    predictedLoad: number;
    deltaPercent: number;
    horizonHours: number;
    queue: number;
    waitHours: number;
    recommendation: string;
  };
}

export interface BackendAiOrderSuggestionResponse {
  analysis: BackendAiAnalysis;
  suggestion: {
    marketRateMin: number;
    marketRateMax: number;
    recommendedPrice: number;
    confidence: number;
    carriersAvailable: number;
    rateLabel: string;
  };
}

export interface BackendAiMatchResponse {
  analysis: BackendAiAnalysis;
  match: {
    confidence: number;
    routeMatch: string;
    weightFit: string;
    transport: string;
  };
}

export interface BackendAiBackhaulItem {
  id: number;
  from: { ru: string; kz: string; en: string };
  to: { ru: string; kz: string; en: string };
  cargo: { ru: string; kz: string; en: string };
  weight: number;
  price: number;
  distance: number;
  matchScore: number;
  departure: string;
}

export interface BackendAiBackhaulResponse {
  analysis: BackendAiAnalysis;
  items: BackendAiBackhaulItem[];
}

export interface BackendAiCustomsResponse {
  analysis: BackendAiAnalysis;
  route: string;
  cargoType: string;
  warnings: string[];
  missingDocs: string[];
}

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem(TOKEN_KEY);
  else window.localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken() {
  return getStoredToken();
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const url = new URL(path, `${BACKEND_URL}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

async function requestJson<T>(path: string, init: RequestInit = {}, query?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body = init.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers,
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with ${response.status}`);
  }
  return payload as T;
}

export const backend = {
  requestJson,
  health: () => requestJson<{ ok: boolean; service: string; time: string }>("/api/health"),
  login: (login: string, password: string) =>
    requestJson<BackendAuthResponse>("/api/auth/login", {
      method: "POST",
      body: { login, password },
    }),
  register: (payload: {
    email: string;
    username: string;
    password: string;
    name: string;
    role: BackendUserRole;
    company?: string;
  }) =>
    requestJson<BackendAuthResponse>("/api/auth/register", {
      method: "POST",
      body: payload,
    }),
  me: () => requestJson<{ user: BackendUser }>("/api/auth/me"),
  dashboard: () => requestJson<BackendDashboard>("/api/dashboard"),
  aiPrompts: () => requestJson<{ items: BackendAiPrompt[] }>("/api/ai/prompts"),
  aiAnalyses: (promptKey?: string) =>
    requestJson<{ items: BackendAiAnalysis[] }>("/api/ai/analyses", {}, { promptKey }),
  aiForecast: (params?: Record<string, string | number | boolean | undefined | null>) =>
    requestJson<BackendAiForecastResponse>("/api/ai/forecast", {}, params),
  aiOrderSuggestion: (payload: {
    from: string;
    to: string;
    cargoType: string;
    weight: number | string;
    price: number | string;
    transport: string;
    language?: string;
  }) =>
    requestJson<BackendAiOrderSuggestionResponse>("/api/ai/order-suggestion", {
      method: "POST",
      body: payload,
    }),
  aiMatchExplanation: (payload: {
    from: string;
    to: string;
    cargoType: string;
    weight: number | string;
    price: number | string;
    transport: string;
    rating?: number | string;
    matchScore?: number | string;
    shipmentId?: string;
    freightId?: string;
    language?: string;
  }) =>
    requestJson<BackendAiMatchResponse>("/api/ai/match-explanation", {
      method: "POST",
      body: payload,
    }),
  aiBackhaul: (payload: {
    from: string;
    to: string;
    capacity?: number | string;
    capacityKg?: number | string;
    language?: string;
  }) =>
    requestJson<BackendAiBackhaulResponse>("/api/ai/backhaul", {
      method: "POST",
      body: payload,
    }),
  aiCustomsAnalyze: (payload: {
    route: string;
    cargoType: string;
    documents: string;
    language?: string;
  }) =>
    requestJson<BackendAiCustomsResponse>("/api/ai/customs/analyze", {
      method: "POST",
      body: payload,
    }),
  drivers: (params?: Record<string, string | number | boolean | undefined | null>) =>
    requestJson<{ items: BackendDriver[] }>("/api/drivers", {}, params),
  driverRecommendations: (params?: Record<string, string | number | boolean | undefined | null>) =>
    requestJson<{ items: BackendDriver[] }>("/api/drivers/recommendations", {}, params),
  freights: (params?: Record<string, string | number | boolean | undefined | null>) =>
    requestJson<{ items: BackendFreight[] }>("/api/freights", {}, params),
  createFreight: (payload: BackendFreightCreatePayload) =>
    requestJson<{ freight: BackendFreight }>("/api/freights", {
      method: "POST",
      body: payload,
    }),
  freightFeed: (params?: Record<string, string | number | boolean | undefined | null>) =>
    requestJson<{ items: BackendFreight[] }>("/api/freights/feed", {}, params),
  freightDecision: (id: string, decision: "take" | "skip") =>
    requestJson<{ decision: unknown; freight: BackendFreight }>(`/api/freights/${id}/decision`, {
      method: "POST",
      body: { decision },
    }),
  ports: (date?: string) => requestJson<{ items: BackendPort[] }>("/api/ports", {}, { date }),
  port: (id: string, date?: string) => requestJson<{ port: BackendPort; slots: Array<{ time: string; status: string; booking: null | unknown }> }>(`/api/ports/${id}`, {}, { date }),
  portSlots: (id: string, date?: string) =>
    requestJson<{ port: BackendPort; date: string; slots: Array<{ time: string; status: string; booking: null | { id: string; portId: string; userId: string; date: string; slot: string; purpose: string; status: string } }> }>(
      `/api/ports/${id}/slots`,
      {},
      { date },
    ),
  bookings: (userId?: string) => requestJson<{ items: BackendBooking[] }>("/api/bookings", {}, { userId }),
  createBooking: (payload: { portId: string; date: string; slot: string; purpose: string }) =>
    requestJson<{ booking: BackendBooking }>("/api/bookings", {
      method: "POST",
      body: payload,
    }),
  lessons: () => requestJson<{ progress: { completed: number; total: number }; items: BackendLesson[] }>("/api/lessons"),
  ratings: () => requestJson<{ rules: BackendRatingRule[]; items: BackendRatingItem[] }>("/api/ratings"),
  trajectories: () => requestJson<{ items: BackendTrajectory[] }>("/api/trajectories"),
};
