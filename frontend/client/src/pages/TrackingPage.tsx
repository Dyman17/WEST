import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle, Clock, MapPin, Package, Ship, Train, Truck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { MapView } from "@/components/Map";
import { backend, type BackendTrajectory } from "@/lib/backend";
import { MAP_LOCATIONS, TRACKING_ROUTES } from "@/data/mapData";

const STATUS_COLORS: Record<string, string> = {
  created: "#B8B0A2",
  accepted: "#C8A96A",
  loading: "#E0C27A",
  in_transit: "#6FA3FF",
  customs: "#E05A5A",
  delivered: "#4FBF9F",
};

const TRANSPORT_ICONS = { truck: Truck, ship: Ship, train: Train };

const TRACKING_COORDS: Record<string, [number, number]> = {
  Aktau: [43.6525, 51.1575],
  Atyrau: [47.0945, 51.9234],
  Kuryk: [43.2, 51.65],
  Baku: [40.2343, 49.5256],
  Turkmenbashi: [40.0, 53.033],
  Beyneu: [45.3184, 55.1889],
  "Russia Border": [51.0, 55.0],
  Almaty: [43.2389, 76.8897],
};

type TrackingOrder = {
  id: string;
  from: { ru: string; kz: string; en: string };
  to: { ru: string; kz: string; en: string };
  cargo: { ru: string; kz: string; en: string };
  carrier: string;
  transport: "truck" | "ship" | "train";
  status: string;
  progress: number;
  weight: number;
  eta: string;
  timeline: Array<{ status: string; time: string; done: boolean }>;
};

function localizedText(
  value: Partial<Record<"ru" | "kz" | "en", string>> | string | undefined,
  lang: "ru" | "kz" | "en",
) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] ?? value.ru ?? value.kz ?? value.en ?? "";
}

function timelineForStatus(status: string) {
  const steps = [
    { status: "created", time: "08:00", done: true },
    { status: "accepted", time: "08:15", done: status !== "created" },
    { status: "loading", time: "10:00", done: ["loading", "in_transit", "customs", "delivered"].includes(status) },
    { status: "in_transit", time: "11:30", done: ["in_transit", "customs", "delivered"].includes(status) },
    { status: "customs", time: "15:00", done: ["customs", "delivered"].includes(status) },
    { status: "delivered", time: "20:45", done: status === "delivered" },
  ];
  return steps;
}

function modeToTransport(mode: string): "truck" | "ship" | "train" {
  if (mode === "sea") return "ship";
  if (mode === "rail" || mode === "train") return "train";
  return "truck";
}

function trajectoryToOrder(trajectory: BackendTrajectory, index: number): TrackingOrder {
  const transport = modeToTransport(trajectory.mode);
  return {
    id: trajectory.id.toUpperCase(),
    from: { ru: trajectory.from, kz: trajectory.from, en: trajectory.from },
    to: { ru: trajectory.to, kz: trajectory.to, en: trajectory.to },
    cargo: {
      ru: trajectory.note,
      kz: trajectory.note,
      en: trajectory.note,
    },
    carrier:
      transport === "ship"
        ? "Caspian Fleet"
        : transport === "train"
          ? "Rail Operator"
          : "WEST Carrier",
    transport,
    status: trajectory.status === "busy" ? "customs" : trajectory.status,
    progress: Math.max(10, Math.min(100, trajectory.load)),
    weight: Math.max(5000, Math.round(trajectory.distance * 30)),
    eta: trajectory.status === "free" ? "—" : trajectory.status === "busy" ? "15:00" : "18:00",
    timeline: timelineForStatus(trajectory.status),
  };
}

function getCoordByName(name: string, fallbackIndex = 0): [number, number] {
  return TRACKING_COORDS[name] ?? [
    MAP_LOCATIONS[fallbackIndex % MAP_LOCATIONS.length].lat,
    MAP_LOCATIONS[fallbackIndex % MAP_LOCATIONS.length].lng,
  ];
}

function buildRouteFromOrder(order: TrackingOrder) {
  const fromCoord = getCoordByName(order.from.en, 0);
  const toCoord = getCoordByName(order.to.en, 1);
  return {
    color: STATUS_COLORS[order.status] ?? "#6FA3FF",
    transport: order.transport,
    path: [
      fromCoord,
      [
        (fromCoord[0] + toCoord[0]) / 2 + 0.35,
        (fromCoord[1] + toCoord[1]) / 2 - 0.55,
      ] as [number, number],
      toCoord,
    ],
    speedKph: order.transport === "ship" ? 40 : order.transport === "train" ? 58 : 52,
    progress: order.progress / 100,
  };
}

function buildRouteLocations(order: TrackingOrder) {
  const fromCoord = getCoordByName(order.from.en, 0);
  const toCoord = getCoordByName(order.to.en, 1);
  const type = order.transport === "train" ? "checkpoint" : "port";

  return [
    {
      id: `${order.id}-from`,
      name: order.from,
      lat: fromCoord[0],
      lng: fromCoord[1],
      type,
      load: Math.min(100, Math.max(20, order.progress)),
      queue: Math.max(1, Math.round(order.progress / 5)),
      waitHours: Math.max(0.5, Number((order.progress / 40).toFixed(1))),
      transport: [order.transport === "ship" ? "ships" : order.transport === "train" ? "trains" : "trucks"],
    },
    {
      id: `${order.id}-to`,
      name: order.to,
      lat: toCoord[0],
      lng: toCoord[1],
      type,
      load: Math.min(100, Math.max(10, 100 - order.progress)),
      queue: Math.max(1, Math.round((100 - order.progress) / 7)),
      waitHours: Math.max(0.5, Number(((100 - order.progress) / 35).toFixed(1))),
      transport: [order.transport === "ship" ? "ships" : order.transport === "train" ? "trains" : "trucks"],
    },
  ];
}

export default function TrackingPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === "dark";
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<TrackingOrder | null>(null);
  const activeOrder = selectedOrder ?? orders[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadTrajectories = async () => {
      try {
        const response = await backend.trajectories();
        if (cancelled) return;
        const mapped = response.items.map((item, index) => trajectoryToOrder(item, index));
        if (mapped.length > 0) {
          setOrders(mapped);
          setSelectedOrder((current) => mapped.find((order) => order.id === current?.id) ?? mapped[0]);
        }
      } catch {
        if (cancelled) return;
        setOrders([]);
        setSelectedOrder(null);
      }
    };

    void loadTrajectories();

    const timer = window.setInterval(() => {
      void loadTrajectories();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [lang]);

  const mapRoute = useMemo(() => {
    if (!activeOrder) return null;
    return TRACKING_ROUTES[activeOrder.id] ?? buildRouteFromOrder(activeOrder);
  }, [activeOrder]);

  const routeLocations = useMemo(() => {
    if (!activeOrder) return [];
    return buildRouteLocations(activeOrder);
  }, [activeOrder]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      created: { ru: "Создан", kz: "Жасалды", en: "Created" },
      accepted: { ru: "Принят", kz: "Қабылданды", en: "Accepted" },
      loading: { ru: "Погрузка", kz: "Тиеу", en: "Loading" },
      in_transit: { ru: "В пути", kz: "Жолда", en: "In Transit" },
      customs: { ru: "Таможня", kz: "Кеден", en: "Customs" },
      delivered: { ru: "Доставлен", kz: "Жеткізілді", en: "Delivered" },
    };
    return labels[status]?.[lang] ?? status;
  };

  if (!activeOrder) {
    return (
      <div className="min-h-[calc(100vh-56px)] p-4">
        <div
          className="rounded-2xl border p-4 text-sm"
          style={{
            background: isDark ? "rgba(17,26,46,0.92)" : "rgba(255,255,255,0.86)",
            borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)",
            color: isDark ? "#B8B0A2" : "#5C6B7A",
          }}
        >
          {lang === "ru" ? "Трекинг загружается из backend..." : lang === "kz" ? "Трекинг backend-тен жүктеліп жатыр..." : "Tracking is loading from backend..."}
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-[calc(100vh-56px)] p-4">
      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div
          className="rounded-2xl border p-4"
          style={{
            background: isDark ? "rgba(17,26,46,0.92)" : "rgba(255,255,255,0.86)",
            borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)",
          }}
        >
          <h1 className="text-lg font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {t("tracking.title")}
          </h1>
          <p className="mb-4 text-sm" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
            {orders.length} {lang === "ru" ? "заказа" : lang === "kz" ? "тапсырыс" : "orders"}
          </p>

          <div className="space-y-2">
            {orders.map((order, index) => {
              const Icon = TRANSPORT_ICONS[order.transport];
              const active = activeOrder.id === order.id;
              const statusColor = STATUS_COLORS[order.status];

              return (
                <motion.button
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full rounded-xl border p-3 text-left transition-all"
                  style={{
                    background: active ? "rgba(200,169,106,0.12)" : isDark ? "#111A2E" : "#fff",
                    borderColor: active ? "rgba(200,169,106,0.35)" : isDark ? "rgba(34,49,79,0.6)" : "rgba(47,74,109,0.1)",
                  }}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A", fontFamily: "'JetBrains Mono', monospace" }}>
                      {order.id}
                    </span>
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${statusColor}15`, color: statusColor }}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={12} style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }} />
                    <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: "13px" }}>
                      {localizedText(order.from, lang)} → {localizedText(order.to, lang)}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                    {localizedText(order.cargo, lang)}
                  </div>
                  <div className="congestion-bar mt-2">
                    <div className="congestion-fill" style={{ width: `${order.progress}%`, background: statusColor }} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{
              background: isDark ? "rgba(17,26,46,0.92)" : "rgba(255,255,255,0.86)",
              borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A", fontFamily: "'JetBrains Mono', monospace" }}>
                    {activeOrder.id}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: `${STATUS_COLORS[activeOrder.status]}15`, color: STATUS_COLORS[activeOrder.status] }}>
                    {getStatusLabel(activeOrder.status)}
                  </span>
                </div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {localizedText(activeOrder.from, lang)} → {localizedText(activeOrder.to, lang)}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                <Bell size={14} />
                <span>{t("tracking.status")}</span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border" style={{ borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)" }}>
            <MapView
              className="h-[360px] w-full"
              locations={routeLocations}
              routes={[mapRoute]}
              locale={lang}
              selectedLocationId={routeLocations[0]?.id ?? null}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {[
              { icon: Package, label: lang === "ru" ? "Груз" : lang === "kz" ? "Жүк" : "Cargo", value: localizedText(activeOrder.cargo, lang) },
              { icon: Truck, label: lang === "ru" ? "Перевозчик" : lang === "kz" ? "Тасымалдаушы" : "Carrier", value: activeOrder.carrier },
              { icon: Clock, label: "ETA", value: activeOrder.eta },
              { icon: MapPin, label: lang === "ru" ? "Прогресс" : lang === "kz" ? "Прогресс" : "Progress", value: `${activeOrder.progress}%` },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border p-3"
                  style={{
                    background: isDark ? "#111A2E" : "#fff",
                    borderColor: isDark ? "rgba(34,49,79,0.6)" : "rgba(47,74,109,0.1)",
                  }}
                >
                  <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                    <Icon size={12} style={{ color: "#C8A96A" }} />
                    <span>{item.label}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: isDark ? "#E6E1D6" : "#1E2A3A" }}>
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{
              background: isDark ? "rgba(17,26,46,0.92)" : "rgba(255,255,255,0.86)",
              borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)",
            }}
          >
            <div className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: isDark ? "rgba(184,176,162,0.6)" : "rgba(92,107,122,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
              {lang === "ru" ? "Хронология" : lang === "kz" ? "Хронология" : "Timeline"}
            </div>
            <div className="relative">
              <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: isDark ? "rgba(34,49,79,0.8)" : "rgba(47,74,109,0.15)" }} />
              <div className="space-y-4">
                {activeOrder.timeline.map((step, index) => {
                  const color = step.done ? STATUS_COLORS[step.status] : isDark ? "rgba(34,49,79,0.8)" : "rgba(47,74,109,0.2)";
                  const current = step.status === activeOrder.status;
                  return (
                    <motion.div
                      key={step.status}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <div
                        className="z-10 flex h-8 w-8 items-center justify-center rounded-full"
                        style={{
                          background: step.done ? `${color}20` : isDark ? "#111A2E" : "#fff",
                          border: `2px solid ${color}`,
                          boxShadow: current ? "0 0 16px rgba(0,0,0,0.25)" : "none",
                        }}
                      >
                        <CheckCircle size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 rounded-xl border p-3" style={{ background: isDark ? "#111A2E" : "#fff", borderColor: isDark ? "rgba(34,49,79,0.55)" : "rgba(47,74,109,0.12)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" style={{ color: isDark ? "#E6E1D6" : "#1E2A3A" }}>
                            {getStatusLabel(step.status)}
                          </span>
                          <span className="text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A", fontFamily: "'JetBrains Mono', monospace" }}>
                            {step.time}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






