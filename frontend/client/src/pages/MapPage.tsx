import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Ship, Train, TrendingUp, Truck, Volume2, X, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { backend, type BackendAiForecastResponse } from "@/lib/backend";
import { MapView } from "@/components/Map";
import { MAP_LOCATIONS, MAP_ROUTES, type MapLocation } from "@/data/mapData";

function getLoadColor(load: number) {
  if (load >= 70) return "#E05A5A";
  if (load >= 40) return "#E0C27A";
  return "#4FBF9F";
}

function getLoadLabel(load: number, t: (key: string) => string) {
  if (load >= 70) return t("map.status.busy");
  if (load >= 40) return t("map.status.medium");
  return t("map.status.free");
}

function CircularProgress({ value, color, size = 64 }: { value: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function getSpeechLocale(lang: string) {
  if (lang === "kz") return "kk-KZ";
  if (lang === "en") return "en-US";
  return "ru-RU";
}

function speakDispatcher(message: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = getSpeechLocale(lang);
  utterance.rate = 1.02;
  utterance.pitch = 1.02;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

export default function MapPage() {
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  const isDark = theme === "dark";
  const [activeFilters, setActiveFilters] = useState<Array<"ships" | "trucks" | "trains">>(["ships", "trucks", "trains"]);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(MAP_LOCATIONS[0]);
  const [aiForecast, setAiForecast] = useState<BackendAiForecastResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!selectedLocation) {
      setAiForecast(null);
      return undefined;
    }

    void backend
      .aiForecast({
        locationId: selectedLocation.id,
        load: selectedLocation.load,
        queue: selectedLocation.queue,
        waitHours: selectedLocation.waitHours,
        lang,
      })
      .then((response) => {
        if (!cancelled) setAiForecast(response);
      })
      .catch(() => {
        if (!cancelled) setAiForecast(null);
      });

    return () => {
      cancelled = true;
    };
  }, [lang, selectedLocation]);

  const filteredLocations = useMemo(
    () => MAP_LOCATIONS.filter((location) =>
      location.transport.some((transport) => activeFilters.includes(transport)),
    ),
    [activeFilters],
  );

  const filteredRoutes = useMemo(
    () => MAP_ROUTES.filter((route) => {
      if (route.transport === "ship") return activeFilters.includes("ships");
      if (route.transport === "train") return activeFilters.includes("trains");
      return activeFilters.includes("trucks");
    }),
    [activeFilters],
  );

  const dispatcherSummary = useMemo(() => {
    if (!selectedLocation) return null;

    const backupLocation = [...filteredLocations]
      .filter((location) => location.id !== selectedLocation.id)
      .sort((a, b) => a.load - b.load)[0];

    const forecastText = aiForecast?.analysis.summary;

    if (lang === "ru") {
      return [
        forecastText ?? `В порту ${selectedLocation.name[lang]} сейчас ${selectedLocation.queue} машин и ожидание ${selectedLocation.waitHours} часа.`,
        backupLocation ? `Рекомендую запасной маршрут через ${backupLocation.name[lang]} с загрузкой ${backupLocation.load} процентов.` : "",
      ].filter(Boolean).join(" ");
    }

    if (lang === "kz") {
      return [
        forecastText ?? `${selectedLocation.name[lang]} портында қазір ${selectedLocation.queue} көлік тұр, күту уақыты ${selectedLocation.waitHours} сағат.`,
        backupLocation ? `Балама бағыт: ${backupLocation.name[lang]} — жүктеме ${backupLocation.load}%.` : "",
      ].filter(Boolean).join(" ");
    }

    return [
      forecastText ?? `${selectedLocation.name[lang]} currently has ${selectedLocation.queue} vehicles and about ${selectedLocation.waitHours} hours of waiting.`,
      backupLocation ? `Recommended backup route: ${backupLocation.name[lang]} with ${backupLocation.load}% load.` : "",
    ].filter(Boolean).join(" ");
  }, [aiForecast?.analysis.summary, filteredLocations, lang, selectedLocation]);

  const handleDispatcherVoice = () => {
    if (!dispatcherSummary) return;
    speakDispatcher(dispatcherSummary, lang);
  };

  const toggleFilter = (filter: "ships" | "trucks" | "trains") => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );
  };

  return (
    <div className="min-h-[calc(100vh-56px)] p-4">
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
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
                <h1 className="text-2xl font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {t("map.title")}
                </h1>
                <p className="text-sm" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                  {t("map.subtitle")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "ships" as const, icon: Ship, label: t("map.filter.ships") },
                  { key: "trucks" as const, icon: Truck, label: t("map.filter.trucks") },
                  { key: "trains" as const, icon: Train, label: t("map.filter.trains") },
                ].map((filter) => {
                  const Icon = filter.icon;
                  const active = activeFilters.includes(filter.key);
                  return (
                    <button
                      key={filter.key}
                      onClick={() => toggleFilter(filter.key)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all"
                      style={{
                        background: active ? "rgba(200,169,106,0.14)" : isDark ? "rgba(34,49,79,0.44)" : "rgba(92,107,122,0.08)",
                        border: active ? "1px solid rgba(200,169,106,0.3)" : isDark ? "1px solid rgba(34,49,79,0.6)" : "1px solid rgba(92,107,122,0.15)",
                        color: active ? "#C8A96A" : isDark ? "#E6E1D6" : "#1E2A3A",
                      }}
                    >
                      <Icon size={14} />
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border" style={{ borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)" }}>
            <MapView
              className="h-[720px] w-full"
              locations={filteredLocations}
              routes={filteredRoutes}
              locale={lang}
              selectedLocationId={selectedLocation?.id ?? null}
              onLocationSelect={setSelectedLocation}
            />
          </div>
        </div>

        <aside
          className="rounded-2xl border p-4"
          style={{
            background: isDark ? "rgba(17,26,46,0.92)" : "rgba(255,255,255,0.86)",
            borderColor: isDark ? "rgba(34,49,79,0.7)" : "rgba(47,74,109,0.12)",
          }}
        >
          <div className="mb-4">
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {selectedLocation?.name[lang] ?? t("map.title")}
            </h2>
            <p className="text-xs" style={{ color: getLoadColor(selectedLocation?.load ?? 0) }}>
              {selectedLocation ? getLoadLabel(selectedLocation.load, t) : t("map.legend")}
            </p>
          </div>

          {selectedLocation && (
            <div
              className="mb-4 rounded-2xl border p-4"
              style={{
                background: isDark ? "rgba(34,49,79,0.25)" : "rgba(92,107,122,0.06)",
                borderColor: `${getLoadColor(selectedLocation.load)}40`,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <CircularProgress value={selectedLocation.load} color={getLoadColor(selectedLocation.load)} size={64} />
                  <div
                    className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
                    style={{ color: getLoadColor(selectedLocation.load), fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {selectedLocation.load}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                    <AlertTriangle size={12} />
                    <span>
                      {t("map.queue")}: <strong>{selectedLocation.queue}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                    <Clock size={12} />
                    <span>
                      {t("map.wait_time")}: <strong>{selectedLocation.waitHours}{t("common.hours")}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 rounded-2xl border p-3" style={{ borderColor: isDark ? "rgba(111,163,255,0.25)" : "rgba(111,163,255,0.25)", background: "rgba(111,163,255,0.08)" }}>
            <div className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold" style={{ color: "#6FA3FF" }}>
              <div className="flex items-center gap-2">
                <Zap size={14} />
                <span>{t("map.ai_forecast")}</span>
              </div>
              <button
                type="button"
                onClick={handleDispatcherVoice}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all btn-neon"
                title={lang === "ru" ? "Прослушать Каспийского диспетчера" : lang === "kz" ? "Каспий диспетчерін тыңдау" : "Listen to the Caspian dispatcher"}
              >
                <Volume2 size={12} />
                <span>{lang === "ru" ? "Голос" : lang === "kz" ? "Дауыс" : "Voice"}</span>
              </button>
            </div>
            <p className="text-sm" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
              {aiForecast?.analysis.summary ??
                (selectedLocation
                  ? (lang === "ru"
                    ? `AI-прогноз для ${selectedLocation.name[lang]} скоро будет готов.`
                    : lang === "kz"
                      ? `${selectedLocation.name[lang]} үшін AI болжамы дайындалып жатыр.`
                      : `AI forecast for ${selectedLocation.name[lang]} is being prepared.`)
                  : t("common.coming_soon"))}
            </p>
            {aiForecast && (
              <p className="mt-2 text-xs" style={{ color: "#6FA3FF", fontFamily: "'JetBrains Mono', monospace" }}>
                {aiForecast.forecast.predictedLoad}% projected load · +{aiForecast.forecast.deltaPercent}%
              </p>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: isDark ? "rgba(184,176,162,0.6)" : "rgba(92,107,122,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
              {t("map.port_load")}
            </div>
            <div className="space-y-2">
              {filteredLocations.map((location) => {
                const color = getLoadColor(location.load);
                const active = selectedLocation?.id === location.id;
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className="w-full rounded-xl border p-3 text-left transition-all"
                    style={{
                      background: active ? "rgba(200,169,106,0.12)" : isDark ? "rgba(34,49,79,0.2)" : "rgba(92,107,122,0.04)",
                      borderColor: active ? "rgba(200,169,106,0.3)" : isDark ? "rgba(34,49,79,0.5)" : "rgba(92,107,122,0.12)",
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium" style={{ color: isDark ? "#E6E1D6" : "#1E2A3A" }}>
                        {location.name[lang]}
                      </div>
                      <span className="rounded-full border px-2 py-0.5 text-xs" style={{ color, borderColor: `${color}40`, background: `${color}12`, fontFamily: "'JetBrains Mono', monospace" }}>
                        {location.load}%
                      </span>
                    </div>
                    <div className="congestion-bar">
                      <div className="congestion-fill" style={{ width: `${location.load}%`, background: color }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                      <span>{t("map.queue")}: {location.queue}</span>
                      <span>{location.waitHours}{t("common.hours")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border p-3" style={{ borderColor: isDark ? "rgba(34,49,79,0.5)" : "rgba(47,74,109,0.12)", background: isDark ? "rgba(34,49,79,0.2)" : "rgba(92,107,122,0.04)" }}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: isDark ? "rgba(184,176,162,0.6)" : "rgba(92,107,122,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
              {t("map.legend")}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#4FBF9F" }} /> <span>{t("map.status.free")}</span></div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#E0C27A" }} /> <span>{t("map.status.medium")}</span></div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: "#E05A5A" }} /> <span>{t("map.status.busy")}</span></div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-3" style={{ borderColor: isDark ? "rgba(200,169,106,0.2)" : "rgba(47,74,109,0.12)" }}>
              <div className="text-lg font-semibold" style={{ color: "#C8A96A", fontFamily: "'JetBrains Mono', monospace" }}>128</div>
              <div className="text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>{t("map.active_routes")}</div>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: isDark ? "rgba(79,191,159,0.2)" : "rgba(47,74,109,0.12)" }}>
              <div className="text-lg font-semibold" style={{ color: "#4FBF9F", fontFamily: "'JetBrains Mono', monospace" }}>342</div>
              <div className="text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>{t("map.vehicles")}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
