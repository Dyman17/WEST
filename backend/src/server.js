import http from "node:http";
import { randomUUID } from "node:crypto";
import { loadStore, persistStore } from "./storage.js";
import { seedUsers } from "./data.js";
import { generateAiAnalysis, listAiAnalyses, listAiPrompts, updateAiPrompt } from "./ai.js";

const PORT = Number(process.env.PORT ?? 8787);
const BASE_URL = `http://localhost:${PORT}`;
const BASE_SLOTS = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
const store = await loadStore();

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT_EXCEPTION", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED_REJECTION", reason);
});

const sessions = new Map();
const allowedRoles = new Set(["admin", "shipper", "carrier"]);

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getStatusFromLoad(load) {
  if (load >= 75) return "busy";
  if (load >= 45) return "medium";
  return "free";
}

function createToken() {
  return randomUUID();
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function publicPort(port, date = getToday()) {
  const bookings = store.bookings.filter((booking) => booking.portId === port.id && booking.date === date);
  const load = Math.min(100, port.load + bookings.length * 5);
  return {
    ...port,
    load,
    status: getStatusFromLoad(load),
    bookedSlots: bookings.length,
    availableSlots: BASE_SLOTS.length - bookings.length,
  };
}

function hashNumber(input) {
  let value = 0;
  for (const char of input) {
    value = (value * 31 + char.charCodeAt(0)) % 100000;
  }
  return value;
}

function slotStatus(portId, date, slot) {
  const booking = store.bookings.find((item) => item.portId === portId && item.date === date && item.slot === slot);
  if (booking) {
    return { status: "busy", booking };
  }

  const seed = hashNumber(`${portId}:${date}:${slot}`);
  if (seed % 5 === 0) return { status: "busy" };
  if (seed % 5 === 1) return { status: "medium" };
  return { status: "free" };
}

function portSlots(portId, date) {
  return BASE_SLOTS.map((slot) => {
    const result = slotStatus(portId, date, slot);
    return {
      time: slot,
      status: result.status,
      booking: result.booking
        ? {
            id: result.booking.id,
            portId: result.booking.portId,
            userId: result.booking.userId,
            date: result.booking.date,
            slot: result.booking.slot,
            purpose: result.booking.purpose,
            status: result.booking.status,
          }
        : null,
    };
  });
}

function driverScore(driver, filters = {}) {
  let score = driver.score;
  const reasons = [];

  if (filters.transportType) {
    if (normalize(filters.transportType) === normalize(driver.transportType)) {
      score += 12;
      reasons.push("Transport type matches");
    } else {
      score -= 8;
    }
  }

  if (filters.origin && driver.routes.some((route) => normalize(route).includes(normalize(filters.origin)))) {
    score += 10;
    reasons.push("Works near origin");
  }

  if (filters.destination && driver.routes.some((route) => normalize(route).includes(normalize(filters.destination)))) {
    score += 10;
    reasons.push("Works near destination");
  }

  if (filters.budget) {
    const budget = Number(filters.budget);
    if (!Number.isNaN(budget)) {
      if (driver.pricePerKm <= budget) {
        score += 10;
        reasons.push("Fits budget");
      } else {
        score -= Math.min(15, Math.round((driver.pricePerKm - budget) / 100));
      }
    }
  }

  if (filters.eco === "true" || filters.eco === true) {
    if (driver.eco >= 80) {
      score += 8;
      reasons.push("Strong eco profile");
    } else {
      score -= 8;
    }
  }

  if (driver.available) {
    score += 5;
    reasons.push("Currently available");
  } else {
    score -= 20;
  }

  score += Math.round(driver.rating * 4);
  score -= driver.delays * 2;
  score -= driver.cancels * 4;

  if (driver.eco >= 85) reasons.push("Eco friendly");
  if (driver.rating >= 4.7) reasons.push("Strong rating");
  if (driver.delays <= 3) reasons.push("Low delay rate");

  return {
    score: Math.max(0, Math.round(score)),
    reasons: [...new Set(reasons)],
  };
}

function freightScore(freight, filters = {}) {
  let score = freight.priority;
  const reasons = [];

  if (filters.transportType) {
    if (normalize(filters.transportType) === normalize(freight.transportType)) {
      score += 15;
      reasons.push("Transport fits route");
    } else {
      score -= 10;
    }
  }

  if (filters.origin && normalize(freight.from).includes(normalize(filters.origin))) {
    score += 10;
    reasons.push("Matches origin");
  }

  if (filters.destination && normalize(freight.to).includes(normalize(filters.destination))) {
    score += 10;
    reasons.push("Matches destination");
  }

  if (filters.maxWeight) {
    const maxWeight = Number(filters.maxWeight);
    if (!Number.isNaN(maxWeight)) {
      if (freight.weight <= maxWeight) {
        score += 8;
        reasons.push("Fits weight limit");
      } else {
        score -= 12;
      }
    }
  }

  if (filters.eco === "true" || filters.eco === true) {
    if (freight.eco) {
      score += 8;
      reasons.push("Eco load");
    } else {
      score -= 8;
    }
  }

  score += Math.round(freight.rating * 4);
  score += freight.eco ? 4 : 0;
  score -= Math.round(freight.distance / 150);

  if (freight.price >= 500000) reasons.push("High value");
  if (freight.eco) reasons.push("Eco cargo");

  return {
    score: Math.max(0, Math.round(score)),
    reasons: [...new Set(reasons)],
  };
}

function getCurrentUser(request) {
  const header = request.headers.authorization ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;

  const token = header.slice(7).trim();
  const userId = sessions.get(token);
  if (!userId) return null;

  return store.users.find((user) => user.id === userId) ?? null;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendNoContent(response) {
  response.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end();
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function roleCapabilities(role) {
  if (role === "admin") return ["manage_all", "view_dashboard", "manage_users"];
  if (role === "shipper") return ["create_orders", "choose_driver", "book_port", "track_cargo"];
  if (role === "carrier") return ["browse_loads", "accept_loads", "book_port", "view_routes"];
  return ["browse_loads", "accept_loads", "book_port", "view_routes"];
}

function buildDashboard() {
  const busyPorts = store.ports.filter((port) => getStatusFromLoad(port.load) === "busy").length;
  const openFreights = store.freights.filter((freight) => freight.status === "open").length;
  const avgDriverScore = store.drivers.reduce((sum, driver) => sum + driver.score, 0) / store.drivers.length;
  const avgRating = store.drivers.reduce((sum, driver) => sum + driver.rating, 0) / store.drivers.length;
  const ecoFreights = store.freights.filter((freight) => freight.eco).length;
  const monthlyRevenue = store.freights.reduce((sum, freight) => sum + freight.price, 0);
  const truckCount = store.drivers.filter((driver) => driver.transportType === "truck").length;
  const shipCount = store.drivers.filter((driver) => driver.transportType === "ship").length;
  const railCount = store.drivers.filter((driver) => driver.transportType === "rail").length;
  const monthlySeries = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => ({
    month,
    trucks: Math.max(200, Math.round(truckCount * 180 + index * 72 + store.freights.length * 15)),
    ships: Math.max(90, Math.round(shipCount * 92 + index * 31 + store.bookings.length * 4)),
    trains: Math.max(60, Math.round(railCount * 68 + index * 24 + store.trajectories.length * 3)),
    revenue: Number((monthlyRevenue / 1000000 + index * 0.22).toFixed(1)),
  }));
  const topRoutes = [...store.freights]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
    .map((freight) => ({
      route: `${freight.from} -> ${freight.to}`,
      price: freight.price,
      status: freight.status,
      transportType: freight.transportType,
    }));

  return {
    generatedAt: new Date().toISOString(),
    metrics: {
      activeUsers: store.users.length,
      openFreights,
      confirmedBookings: store.bookings.length,
      busyPorts,
      averageDriverScore: Math.round(avgDriverScore),
      averageDriverRating: Number(avgRating.toFixed(1)),
      ecoFreightShare: Math.round((ecoFreights / store.freights.length) * 100),
      estimatedMonthlyRevenueKzt: monthlyRevenue,
    },
    topRoutes,
    monthlySeries,
  };
}

function langText(lang, variants) {
  return variants[lang] ?? variants.en;
}

function buildForecastPayload(location, lang) {
  const currentLoad = Number(location.load ?? 0);
  const queue = Number(location.queue ?? 0);
  const waitHours = Number(location.waitHours ?? 0);
  const predictedLoad = Math.min(100, Math.round(currentLoad + Math.max(6, queue * 0.35 + waitHours * 4)));
  const deltaPercent = Math.max(1, predictedLoad - currentLoad);
  const recommendation = currentLoad >= 70
    ? langText(lang, {
        ru: "Лучше уходить через Курык или бронировать слот заранее.",
        kz: "Құрық арқылы шығу немесе слотты алдын ала брондау керек.",
        en: "Route via Kuryk or book a slot before arrival.",
      })
    : langText(lang, {
        ru: "Сейчас окно ещё рабочее, но слот лучше удерживать заранее.",
        kz: "Қазір жағдай жұмысқа жарамды, бірақ слотты алдын ала ұстаған дұрыс.",
        en: "The window is still manageable, but a reservation is safer.",
      });

  return {
    forecast: {
      locationId: location.id,
      locationName: location.name?.[lang] ?? location.name?.en ?? location.name ?? location.id,
      currentLoad,
      predictedLoad,
      deltaPercent,
      horizonHours: 2,
      queue,
      waitHours,
      recommendation,
    },
    fallbackSummary: langText(lang, {
      ru: `${location.name?.[lang] ?? location.name?.ru ?? location.id}: через 2 часа загрузка вырастет до ${predictedLoad}%. ${recommendation}`,
      kz: `${location.name?.[lang] ?? location.name?.kz ?? location.id}: 2 сағаттан кейін жүктеме ${predictedLoad}% болады. ${recommendation}`,
      en: `${location.name?.[lang] ?? location.name?.en ?? location.id}: load will rise to ${predictedLoad}% in 2 hours. ${recommendation}`,
    }),
    fallbackBullets: [
      langText(lang, {
        ru: `Очередь может вырасти до ${queue + Math.max(3, Math.round(queue * 0.2))} машин.`,
        kz: `Кезек ${queue + Math.max(3, Math.round(queue * 0.2))} көлікке дейін өсуі мүмкін.`,
        en: `The queue may rise to ${queue + Math.max(3, Math.round(queue * 0.2))} vehicles.`,
      }),
      recommendation,
      langText(lang, {
        ru: `Текущая загрузка ${currentLoad}% и ожидание ${waitHours} ч.`,
        kz: `Қазіргі жүктеме ${currentLoad}% және күту ${waitHours} сағ.`,
        en: `Current load is ${currentLoad}% with a ${waitHours}h wait.`,
      }),
    ],
  };
}

function buildOrderSuggestionPayload(payload, lang) {
  const weight = Number(payload.weight ?? 0);
  const price = Number(payload.price ?? 0);
  const baseMarket = Math.max(price || 0, Math.round(weight * 18000 + 120000));
  const marketRateMin = Math.round(baseMarket * 0.85);
  const marketRateMax = Math.round(baseMarket * 1.15);
  const recommendedPrice = Math.round((marketRateMin + marketRateMax) / 2);
  const confidence = Math.min(97, Math.max(62, 72 + Math.round(weight / 2)));
  const rateLabel = price < marketRateMin ? langText(lang, { ru: "ниже рынка", kz: "нарықтан төмен", en: "below market" }) :
    price > marketRateMax ? langText(lang, { ru: "выше рынка", kz: "нарықтан жоғары", en: "above market" }) :
    langText(lang, { ru: "в рынке", kz: "нарықта", en: "market fair" });

  return {
    suggestion: {
      marketRateMin,
      marketRateMax,
      recommendedPrice,
      confidence,
      carriersAvailable: Math.max(3, Math.min(12, Math.round(weight / 3) + 4)),
      rateLabel,
    },
    fallbackSummary: langText(lang, {
      ru: `Ставка ${rateLabel}. Рекомендуемый коридор: ${marketRateMin.toLocaleString("ru-RU")}–${marketRateMax.toLocaleString("ru-RU")} ₸.`,
      kz: `Баға ${rateLabel}. Ұсынылған диапазон: ${marketRateMin.toLocaleString("ru-RU")}–${marketRateMax.toLocaleString("ru-RU")} ₸.`,
      en: `The rate is ${rateLabel}. Suggested range: ${marketRateMin.toLocaleString("en-US")}–${marketRateMax.toLocaleString("en-US")} KZT.`,
    }),
    fallbackBullets: [
      langText(lang, {
        ru: `Данные показывают диапазон ${marketRateMin.toLocaleString("ru-RU")}–${marketRateMax.toLocaleString("ru-RU")} ₸.`,
        kz: `Деректер ${marketRateMin.toLocaleString("ru-RU")}–${marketRateMax.toLocaleString("ru-RU")} ₸ аралығын көрсетеді.`,
        en: `Data points to a ${marketRateMin.toLocaleString("en-US")}–${marketRateMax.toLocaleString("en-US")} KZT range.`,
      }),
      langText(lang, {
        ru: `Перевозчикам удобно закрывать такой рейс за ${confidence}% от обычного времени.`,
        kz: `Тасымалдаушылар мұндай рейсті әдеттегіден ${confidence}% жылдам жабады.`,
        en: `Carriers usually fill this route ${confidence}% faster than average.`,
      }),
      langText(lang, {
        ru: `Для быстрого матча можно поднять цену до ${recommendedPrice.toLocaleString("ru-RU")} ₸.`,
        kz: `Жылдам матч үшін бағаны ${recommendedPrice.toLocaleString("ru-RU")} ₸-ға дейін көтеруге болады.`,
        en: `To speed up the match, raise the bid to ${recommendedPrice.toLocaleString("en-US")} KZT.`,
      }),
    ],
  };
}

function buildMatchExplanationPayload(payload, lang) {
  const matchScore = Number(payload.matchScore ?? Math.round(Number(payload.rating ?? 0) * 20) ?? 0);
  const weight = Number(payload.weight ?? 0);
  const transport = String(payload.transport ?? payload.transportType ?? "truck");
  const routeMatch = matchScore >= 90
    ? langText(lang, { ru: "Маршрут совпадает почти идеально.", kz: "Маршрут дерлік мінсіз сәйкес келеді.", en: "The route is almost an exact fit." })
    : langText(lang, { ru: "Маршрут подходит, но есть запас для улучшения.", kz: "Маршрут сәйкес келеді, бірақ жақсартуға орын бар.", en: "The route fits, but there is room to improve." });

  return {
    match: {
      confidence: Math.max(52, Math.min(99, matchScore)),
      routeMatch,
      weightFit: weight > 0 ? `${Math.max(1, Math.round(weight / 1000))}t` : "unknown",
      transport,
    },
    fallbackSummary: langText(lang, {
      ru: `${routeMatch} Вес и тип транспорта подходят для этого груза.`,
      kz: `${routeMatch} Салмақ пен көлік түрі бұл жүкке сай келеді.`,
      en: `${routeMatch} The weight and transport type fit this cargo.`,
    }),
    fallbackBullets: [
      langText(lang, {
        ru: `Сильный матч по маршруту и типу транспорта.`,
        kz: `Маршрут пен көлік түрі бойынша күшті сәйкестік.`,
        en: `Strong match on route and transport type.`,
      }),
      langText(lang, {
        ru: `Можно загрузить рейс без лишнего отклонения от маршрута.`,
        kz: `Маршруттан артық ауытқусыз жүктеуге болады.`,
        en: `The trip can be loaded without route deviation.`,
      }),
      langText(lang, {
        ru: `Профиль перевозчика поддерживает этот уровень риска.`,
        kz: `Тасымалдаушы профилі бұл тәуекел деңгейін көтереді.`,
        en: `The carrier profile supports this risk level.`,
      }),
    ],
  };
}

function buildBackhaulPayload(store, payload, lang) {
  const from = String(payload.from ?? payload.origin ?? "Baku");
  const to = String(payload.to ?? payload.destination ?? "Aktau");
  const capacity = Number(payload.capacity ?? payload.capacityKg ?? 18000);
  const openFreights = [...store.freights]
    .filter((freight) => freight.status === "open")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);

  const items = openFreights.map((freight, index) => ({
    id: index + 1,
    from: { ru: freight.from, kz: freight.from, en: freight.from },
    to: { ru: freight.to, kz: freight.to, en: freight.to },
    cargo: { ru: freight.type, kz: freight.type, en: freight.type },
    weight: Math.round(Number(freight.weight ?? 0) * 1000),
    price: Number(freight.price ?? 0),
    distance: Number(freight.distance ?? 0),
    matchScore: Number(freight.priority ?? 0),
    departure: freight.deadline?.slice(11, 16) || "10:00",
  }));

  const topItem = items[0] ?? null;
  return {
    items,
    fallbackSummary: langText(lang, {
      ru: `На маршруте ${from} → ${to} лучше всего подойдут контейнеры и грузы с высокой маржой. Свободная ёмкость: ${capacity} кг.`,
      kz: `${from} → ${to} бағыты үшін контейнерлер мен маржасы жоғары жүктер тиімді. Бос сыйымдылық: ${capacity} кг.`,
      en: `For the ${from} → ${to} route, containers and high-margin cargo fit best. Free capacity: ${capacity} kg.`,
    }),
    fallbackBullets: topItem
      ? [
          langText(lang, {
            ru: `Лучший вариант сейчас — ${topItem.cargo[lang]} по маршруту ${topItem.from[lang]} → ${topItem.to[lang]}.`,
            kz: `Қазір ең жақсы нұсқа — ${topItem.cargo[lang]} ${topItem.from[lang]} → ${topItem.to[lang]} бағыты бойынша.`,
            en: `Best current option: ${topItem.cargo[lang]} on ${topItem.from[lang]} → ${topItem.to[lang]}.`,
          }),
          langText(lang, {
            ru: `Прибыль закрывает пустой пробег и держит рентабельность рейса.`,
            kz: `Пайда бос жүрісті жауып, рейстің рентабельдігін ұстайды.`,
            en: `The payout covers empty miles and keeps the trip profitable.`,
          }),
          langText(lang, {
            ru: `Ёмкость ${capacity} кг позволяет принять этот груз без отклонения.`,
            kz: `${capacity} кг сыйымдылық бұл жүкті ауытқусыз алуға жеткілікті.`,
            en: `${capacity} kg capacity is enough to take this load without detour.`,
          }),
        ]
      : [
          langText(lang, {
            ru: "На выбранном маршруте пока нет подходящих обратных грузов.",
            kz: "Таңдалған бағытта әзірге қолайлы кері жүк жоқ.",
            en: "There are no suitable backhaul options on this route yet.",
          }),
        ],
  };
}

function buildCustomsPayload(payload, lang) {
  const route = String(payload.route ?? payload.routeCode ?? "KZ-TM-AZ");
  const cargoType = String(payload.cargoType ?? "Containers");
  const documents = String(payload.documents ?? "");
  const missingDocs = [
    langText(lang, { ru: "Сертификат происхождения", kz: "Шығу тегі сертификаты", en: "Certificate of Origin" }),
    langText(lang, { ru: "Транзитная декларация", kz: "Транзиттік декларация", en: "Transit declaration" }),
  ];

  const warnings = [
    langText(lang, {
      ru: `Маршрут ${route} требует проверки документов до границы.`,
      kz: `${route} бағыты шекараға дейін құжаттарды тексеруді қажет етеді.`,
      en: `Route ${route} requires a document check before the border.`,
    }),
    langText(lang, {
      ru: `Для груза типа ${cargoType} проверьте упаковку и инвойс.`,
      kz: `${cargoType} жүгі үшін қаптама мен инвойсты тексеріңіз.`,
      en: `For ${cargoType}, verify packing and invoice details.`,
    }),
  ];

  return {
    route,
    cargoType,
    missingDocs,
    warnings: documents ? warnings : [...warnings, langText(lang, { ru: "Документы еще не загружены.", kz: "Құжаттар әлі жүктелмеген.", en: "Documents have not been uploaded yet." })],
    fallbackSummary: langText(lang, {
      ru: `Для маршрута ${route} не хватает части таможенного пакета. Проверьте документы до выезда.`,
      kz: `${route} бағыты үшін кедендік пакеттің бір бөлігі жетіспейді. Жолға шығар алдында тексеріңіз.`,
      en: `The customs package for ${route} is incomplete. Verify documents before departure.`,
    }),
    fallbackBullets: warnings,
  };
}

export {
  buildBackhaulPayload,
  buildCustomsPayload,
  buildForecastPayload,
  buildMatchExplanationPayload,
  buildOrderSuggestionPayload,
};

function listUsers(role) {
  const users = role ? store.users.filter((user) => user.role === role) : store.users;
  return users.map(publicUser);
}

function listDrivers(filters = {}) {
  return [...store.drivers]
    .map((driver) => ({
      ...driver,
      match: driverScore(driver, filters),
    }))
    .sort((a, b) => b.match.score - a.match.score);
}

function listFreights(filters = {}) {
  return [...store.freights]
    .map((freight) => ({
      ...freight,
      match: freightScore(freight, filters),
    }))
    .sort((a, b) => b.match.score - a.match.score);
}

function buildBookingsView(bookings) {
  return bookings.map((booking) => {
    const port = store.ports.find((item) => item.id === booking.portId);
    const user = store.users.find((item) => item.id === booking.userId);
    return {
      ...booking,
      port: port ? { id: port.id, name: port.name, city: port.city } : null,
      user: user ? publicUser(user) : null,
    };
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url ?? "/", BASE_URL);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  if (pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, {
      ok: true,
      service: "west-logistics-backend",
      time: new Date().toISOString(),
    });
    return;
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    const body = await readJson(request);
    const login = normalize(body.login ?? body.email ?? body.username);
    const password = String(body.password ?? "");
    const user = store.users.find((item) => [normalize(item.email), normalize(item.username)].includes(login) && item.password === password);

    if (!user) {
      sendJson(response, 401, { error: "Invalid login or password" });
      return;
    }

    const token = createToken();
    sessions.set(token, user.id);
    sendJson(response, 200, {
      token,
      user: publicUser(user),
    });
    return;
  }

  if (pathname === "/api/auth/register" && request.method === "POST") {
    const body = await readJson(request);
    const email = normalize(body.email);
    const username = normalize(body.username || email.split("@")[0]);
    const password = String(body.password ?? "1234");
    const name = String(body.name ?? "West User").trim();
    const role = allowedRoles.has(normalize(body.role)) ? normalize(body.role) : "shipper";

    if (!email || !username || !name) {
      sendJson(response, 400, { error: "name, email and username are required" });
      return;
    }

    const duplicate = store.users.some((user) => normalize(user.email) === email || normalize(user.username) === username);
    if (duplicate) {
      sendJson(response, 409, { error: "User already exists" });
      return;
    }

    const user = {
      id: `user-${randomUUID()}`,
      username,
      email,
      name,
      role,
      password,
      company: String(body.company ?? "WEST Demo"),
      capabilities: roleCapabilities(role),
      createdAt: new Date().toISOString(),
    };

    store.users.unshift(user);
    await persistStore(store);

    const token = createToken();
    sessions.set(token, user.id);
    sendJson(response, 201, {
      token,
      user: publicUser(user),
    });
    return;
  }

  if ((pathname === "/api/auth/me" || pathname === "/api/me") && request.method === "GET") {
    const user = getCurrentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  if (pathname === "/api/users" && request.method === "GET") {
    const role = url.searchParams.get("role") ?? "";
    sendJson(response, 200, { items: listUsers(role || undefined) });
    return;
  }

  if (pathname.startsWith("/api/users/") && request.method === "GET") {
    const id = pathname.split("/")[3];
    const user = store.users.find((item) => item.id === id);
    if (!user) {
      sendJson(response, 404, { error: "User not found" });
      return;
    }

    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  if (pathname === "/api/drivers" && request.method === "GET") {
    const filters = {
      origin: url.searchParams.get("origin") ?? "",
      destination: url.searchParams.get("destination") ?? "",
      transportType: url.searchParams.get("transportType") ?? "",
      budget: url.searchParams.get("budget") ?? "",
      eco: url.searchParams.get("eco") ?? "",
    };

    sendJson(response, 200, { items: listDrivers(filters) });
    return;
  }

  if (pathname === "/api/drivers/recommendations" && request.method === "GET") {
    const filters = {
      origin: url.searchParams.get("origin") ?? "",
      destination: url.searchParams.get("destination") ?? "",
      transportType: url.searchParams.get("transportType") ?? "",
      budget: url.searchParams.get("budget") ?? "",
      eco: url.searchParams.get("eco") ?? "",
      limit: Number(url.searchParams.get("limit") ?? 5),
    };
    const items = listDrivers(filters).slice(0, Number.isNaN(filters.limit) ? 5 : filters.limit);
    sendJson(response, 200, { items });
    return;
  }

  if (pathname.startsWith("/api/drivers/") && request.method === "GET") {
    const id = pathname.split("/")[3];
    const driver = store.drivers.find((item) => item.id === id);
    if (!driver) {
      sendJson(response, 404, { error: "Driver not found" });
      return;
    }

    sendJson(response, 200, { driver, match: driverScore(driver) });
    return;
  }

  if (pathname === "/api/freights" && request.method === "GET") {
    const filters = {
      origin: url.searchParams.get("origin") ?? "",
      destination: url.searchParams.get("destination") ?? "",
      transportType: url.searchParams.get("transportType") ?? "",
      maxWeight: url.searchParams.get("maxWeight") ?? "",
      eco: url.searchParams.get("eco") ?? "",
    };

    sendJson(response, 200, { items: listFreights(filters) });
    return;
  }

  if (pathname === "/api/freights" && request.method === "POST") {
    const user = getCurrentUser(request);
    if (user && !["shipper", "admin"].includes(user.role)) {
      sendJson(response, 403, { error: "Shipper access required" });
      return;
    }

    const body = await readJson(request);
    const from = normalize(body.from ?? body.origin ?? "");
    const to = normalize(body.to ?? body.destination ?? "");
    const weight = Number(body.weight ?? body.weightTon ?? 0);
    const type = String(body.type ?? body.cargoType ?? "General").trim() || "General";
    const price = Number(body.price ?? body.priceKzt ?? 0);
    const transportType = normalize(body.transportType ?? body.transport ?? "truck") || "truck";
    const eco = Boolean(body.eco ?? body.isEco ?? false);
    const deadline = String(body.deadline ?? body.date ?? getToday());

    if (!from || !to || !Number.isFinite(weight) || weight <= 0) {
      sendJson(response, 400, { error: "from, to and weight are required" });
      return;
    }

    const freight = {
      id: `freight-${randomUUID()}`,
      from,
      to,
      weight,
      type,
      price: Number.isFinite(price) ? price : Math.max(50000, Math.round(weight * 24000)),
      shipper: user?.company ?? user?.name ?? "WEST Shipper",
      rating: 4.8,
      eco,
      distance: Number(body.distance ?? Math.max(50, Math.round(weight * 28))),
      transportType,
      status: "open",
      priority: Number(body.priority ?? Math.min(100, Math.max(50, Math.round(60 + weight * 1.5)))),
      deadline,
    };

    store.freights.unshift(freight);
    await persistStore(store);

    sendJson(response, 201, {
      freight,
    });
    return;
  }

  if ((pathname === "/api/freights/feed" || pathname === "/api/freights/recommendations") && request.method === "GET") {
    const filters = {
      origin: url.searchParams.get("origin") ?? "",
      destination: url.searchParams.get("destination") ?? "",
      transportType: url.searchParams.get("transportType") ?? "",
      maxWeight: url.searchParams.get("maxWeight") ?? "",
      eco: url.searchParams.get("eco") ?? "",
      limit: Number(url.searchParams.get("limit") ?? 6),
    };

    const items = listFreights(filters).slice(0, Number.isNaN(filters.limit) ? 6 : filters.limit);
    sendJson(response, 200, { items });
    return;
  }

  if (pathname.startsWith("/api/freights/") && pathname.endsWith("/decision") && request.method === "POST") {
    const id = pathname.split("/")[3];
    const freight = store.freights.find((item) => item.id === id);
    if (!freight) {
      sendJson(response, 404, { error: "Freight not found" });
      return;
    }

    const user = getCurrentUser(request);
    const body = await readJson(request);
    const decision = normalize(body.decision);

    if (!["take", "skip"].includes(decision)) {
      sendJson(response, 400, { error: "decision must be take or skip" });
      return;
    }

    const record = {
      id: `decision-${randomUUID()}`,
      freightId: freight.id,
      userId: user?.id ?? null,
      decision,
      createdAt: new Date().toISOString(),
    };

    store.freightDecisions.push(record);
    if (decision === "take") {
      freight.status = "reserved";
    }
    await persistStore(store);

    sendJson(response, 200, {
      decision: record,
      freight,
    });
    return;
  }

  if (pathname.startsWith("/api/freights/") && request.method === "GET") {
    const id = pathname.split("/")[3];
    const freight = store.freights.find((item) => item.id === id);
    if (!freight) {
      sendJson(response, 404, { error: "Freight not found" });
      return;
    }

    const recommendations = listDrivers({
      origin: freight.from,
      destination: freight.to,
      transportType: freight.transportType,
      eco: String(freight.eco),
    }).slice(0, 5);

    sendJson(response, 200, {
      freight,
      recommendedDrivers: recommendations,
    });
    return;
  }

  if (pathname === "/api/ports" && request.method === "GET") {
    const date = url.searchParams.get("date") ?? getToday();
    sendJson(response, 200, {
      items: store.ports.map((port) => publicPort(port, date)),
    });
    return;
  }

  if (pathname.startsWith("/api/ports/") && pathname.endsWith("/slots") && request.method === "GET") {
    const id = pathname.split("/")[3];
    const date = url.searchParams.get("date") ?? getToday();
    const port = store.ports.find((item) => item.id === id);
    if (!port) {
      sendJson(response, 404, { error: "Port not found" });
      return;
    }

    sendJson(response, 200, {
      port: publicPort(port, date),
      date,
      slots: portSlots(port.id, date),
    });
    return;
  }

  if (pathname.startsWith("/api/ports/") && request.method === "GET") {
    const id = pathname.split("/")[3];
    const date = url.searchParams.get("date") ?? getToday();
    const port = store.ports.find((item) => item.id === id);
    if (!port) {
      sendJson(response, 404, { error: "Port not found" });
      return;
    }

    sendJson(response, 200, {
      port: publicPort(port, date),
      slots: portSlots(port.id, date),
    });
    return;
  }

  if (pathname === "/api/bookings" && request.method === "GET") {
    const user = getCurrentUser(request);
    const userId = url.searchParams.get("userId") ?? user?.id ?? "";
    const items = userId
      ? store.bookings.filter((booking) => booking.userId === userId)
      : store.bookings;

    sendJson(response, 200, {
      items: buildBookingsView(items),
    });
    return;
  }

  if (pathname === "/api/bookings" && request.method === "POST") {
    const user = getCurrentUser(request);
    if (!user) {
      sendJson(response, 401, { error: "Unauthorized" });
      return;
    }

    const body = await readJson(request);
    const portId = normalize(body.portId);
    const date = String(body.date ?? getToday());
    const slot = String(body.slot ?? "");
    const purpose = String(body.purpose ?? "general");

    const port = store.ports.find((item) => item.id === portId);
    if (!port) {
      sendJson(response, 404, { error: "Port not found" });
      return;
    }

    if (!BASE_SLOTS.includes(slot)) {
      sendJson(response, 400, { error: "Invalid slot" });
      return;
    }

    const existing = store.bookings.find((booking) => booking.portId === portId && booking.date === date && booking.slot === slot);
    if (existing) {
      sendJson(response, 409, { error: "Slot already booked" });
      return;
    }

    const booking = {
      id: `booking-${randomUUID()}`,
      portId,
      userId: user.id,
      date,
      slot,
      purpose,
      status: "confirmed",
    };

    store.bookings.push(booking);
    await persistStore(store);
    sendJson(response, 201, {
      booking: buildBookingsView([booking])[0],
    });
    return;
  }

  if (pathname === "/api/lessons" && request.method === "GET") {
    const user = getCurrentUser(request);
    const progress = user
      ? Math.min(store.lessons.length, Math.max(1, user.role === "shipper" ? 2 : user.role === "carrier" ? 4 : store.lessons.length))
      : 2;

    sendJson(response, 200, {
      progress: {
        completed: progress,
        total: store.lessons.length,
      },
      items: store.lessons,
    });
    return;
  }

  if (pathname === "/api/ratings" && request.method === "GET") {
    sendJson(response, 200, {
      rules: store.ratingRules,
      items: [...store.drivers]
        .sort((a, b) => b.score - a.score)
        .map((driver) => ({
          id: driver.id,
          name: driver.name,
          transportType: driver.transportType,
          score: driver.score,
          rating: driver.rating,
          trips: driver.trips,
          eco: driver.eco,
          penalties: {
            delays: driver.delays,
            cancellations: driver.cancels,
          },
          quality: Math.max(0, Math.min(100, Math.round(driver.rating * 20 - driver.delays * 2 - driver.cancels * 3))),
        })),
    });
    return;
  }

  if (pathname === "/api/trajectories" && request.method === "GET") {
    sendJson(response, 200, {
      items: store.trajectories,
    });
    return;
  }

  if (pathname === "/api/dashboard" && request.method === "GET") {
    sendJson(response, 200, buildDashboard());
    return;
  }

  if (pathname === "/api/ai/prompts" && request.method === "GET") {
    sendJson(response, 200, {
      items: listAiPrompts(store),
    });
    return;
  }

  if (pathname === "/api/ai/analyses" && request.method === "GET") {
    const promptKey = url.searchParams.get("promptKey") ?? "";
    sendJson(response, 200, {
      items: listAiAnalyses(store, promptKey || undefined).slice(0, 100),
    });
    return;
  }

  if (pathname.startsWith("/api/ai/prompts/") && request.method === "PUT") {
    const user = getCurrentUser(request);
    if (user?.role !== "admin") {
      sendJson(response, 403, { error: "Admin access required" });
      return;
    }

    const key = pathname.split("/")[4];
    const body = await readJson(request);
    const prompt = updateAiPrompt(store, key, body);
    if (!prompt) {
      sendJson(response, 404, { error: "Prompt not found" });
      return;
    }

    await persistStore(store);
    sendJson(response, 200, { prompt });
    return;
  }

  if (pathname === "/api/ai/forecast" && request.method === "GET") {
    const locationId = normalize(url.searchParams.get("locationId"));
    const location = store.ports.find((port) => normalize(port.id) === locationId) ?? store.ports[0];
    if (!location) {
      sendJson(response, 404, { error: "Location not found" });
      return;
    }

    const lang = normalize(url.searchParams.get("lang") ?? "en") || "en";
    const currentLoad = Number(url.searchParams.get("load") ?? location.load ?? 0);
    const queue = Number(url.searchParams.get("queue") ?? 0);
    const waitHours = Number(url.searchParams.get("waitHours") ?? 0);
    const payload = buildForecastPayload({
      ...location,
      load: currentLoad,
      queue,
      waitHours,
    }, lang);
    const { analysis } = await generateAiAnalysis({
      store,
      promptKey: "map_forecast",
      entityType: "port",
      entityId: location.id,
      input: {
        locationName: location.name?.[lang] ?? location.name?.en ?? location.name ?? location.id,
        load: currentLoad,
        queue,
        waitHours,
        language: lang,
      },
      fallbackSummary: payload.fallbackSummary,
      fallbackBullets: payload.fallbackBullets,
      extraInstructions: "Return the answer in the requested language and include the operational recommendation first.",
      maxOutputTokens: 180,
    });

    await persistStore(store);
    sendJson(response, 200, {
      analysis,
      forecast: payload.forecast,
    });
    return;
  }

  if (pathname === "/api/ai/order-suggestion" && request.method === "POST") {
    const body = await readJson(request);
    const lang = normalize(body.language ?? "en") || "en";
    const payload = buildOrderSuggestionPayload(body, lang);
    const { analysis } = await generateAiAnalysis({
      store,
      promptKey: "order_suggestion",
      entityType: "shipment",
      entityId: `${normalize(body.from)}-${normalize(body.to)}-${normalize(body.cargoType) || "shipment"}`,
      input: {
        from: body.from ?? "",
        to: body.to ?? "",
        cargoType: body.cargoType ?? "",
        weight: Number(body.weight ?? 0),
        price: Number(body.price ?? 0),
        transport: body.transport ?? "truck",
        language: lang,
      },
      fallbackSummary: payload.fallbackSummary,
      fallbackBullets: payload.fallbackBullets,
      extraInstructions: "State whether the price is below market, fair, or above market. Mention one concrete adjustment.",
      maxOutputTokens: 180,
    });

    await persistStore(store);
    sendJson(response, 200, {
      analysis,
      suggestion: payload.suggestion,
    });
    return;
  }

  if (pathname === "/api/ai/match-explanation" && request.method === "POST") {
    const body = await readJson(request);
    const lang = normalize(body.language ?? "en") || "en";
    const payload = buildMatchExplanationPayload(body, lang);
    const { analysis } = await generateAiAnalysis({
      store,
      promptKey: "tinder_match",
      entityType: "freight",
      entityId: String(body.shipmentId ?? body.freightId ?? body.id ?? `${normalize(body.from)}-${normalize(body.to)}`),
      input: {
        from: body.from ?? "",
        to: body.to ?? "",
        cargoType: body.cargoType ?? "",
        weight: Number(body.weight ?? 0),
        price: Number(body.price ?? 0),
        transport: body.transport ?? body.transportType ?? "truck",
        rating: Number(body.rating ?? 0),
        matchScore: Number(body.matchScore ?? 0),
        language: lang,
      },
      fallbackSummary: payload.fallbackSummary,
      fallbackBullets: payload.fallbackBullets,
      extraInstructions: "Explain the match in one sentence and add two short bullet points.",
      maxOutputTokens: 160,
    });

    await persistStore(store);
    sendJson(response, 200, {
      analysis,
      match: payload.match,
    });
    return;
  }

  if (pathname === "/api/ai/backhaul" && request.method === "POST") {
    const body = await readJson(request);
    const lang = normalize(body.language ?? "en") || "en";
    const payload = buildBackhaulPayload(store, body, lang);
    const { analysis } = await generateAiAnalysis({
      store,
      promptKey: "backhaul_match",
      entityType: "route",
      entityId: `${normalize(body.from)}-${normalize(body.to)}-${Date.now()}`,
      input: {
        from: body.from ?? "",
        to: body.to ?? "",
        capacity: Number(body.capacity ?? body.capacityKg ?? 0),
        language: lang,
      },
      fallbackSummary: payload.fallbackSummary,
      fallbackBullets: payload.fallbackBullets,
      extraInstructions: "Rank the best return cargo options and focus on empty-mile reduction.",
      maxOutputTokens: 180,
    });

    await persistStore(store);
    sendJson(response, 200, {
      analysis,
      items: payload.items,
    });
    return;
  }

  if (pathname === "/api/ai/customs/analyze" && request.method === "POST") {
    const body = await readJson(request);
    const lang = normalize(body.language ?? "en") || "en";
    const payload = buildCustomsPayload(body, lang);
    const { analysis } = await generateAiAnalysis({
      store,
      promptKey: "customs_analysis",
      entityType: "route",
      entityId: String(body.route ?? body.routeCode ?? "customs"),
      input: {
        route: body.route ?? body.routeCode ?? "KZ-TM-AZ",
        cargoType: body.cargoType ?? "",
        documents: body.documents ?? "",
        language: lang,
      },
      fallbackSummary: payload.fallbackSummary,
      fallbackBullets: payload.fallbackBullets,
      extraInstructions: "List the missing customs documents and one next step for the driver.",
      maxOutputTokens: 180,
    });

    await persistStore(store);
    sendJson(response, 200, {
      analysis,
      route: payload.route,
      cargoType: payload.cargoType,
      warnings: payload.warnings,
      missingDocs: payload.missingDocs,
    });
    return;
  }

  sendJson(response, 404, {
    error: "Route not found",
    path: pathname,
  });
}

const server = http.createServer((request, response) => {
  void handleRequest(request, response).catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, 500, {
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    } else {
      response.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`WEST backend is running at ${BASE_URL}`);
  console.log("Demo accounts:");
  for (const user of seedUsers) {
    console.log(`- ${user.email} / 1234 (${user.role})`);
  }
});
