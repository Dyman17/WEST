import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import type { MapLocation, MapRoute, LocaleCode } from "@/data/mapData";

interface MapViewProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  routes?: MapRoute[];
  locale?: LocaleCode;
  selectedLocationId?: string | null;
  onLocationSelect?: (location: MapLocation) => void;
}

function iconForType(type: MapLocation["type"]) {
  return type === "port" ? "⚓" : "⛔";
}

function routeIcon(type: MapRoute["transport"]) {
  if (type === "ship") return "🚢";
  if (type === "train") return "🚆";
  return "🚛";
}

function loadColor(load: number) {
  if (load >= 70) return "#E05A5A";
  if (load >= 40) return "#E0C27A";
  return "#4FBF9F";
}

function haversineKm(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLng = (b[1] - a[1]) * rad;
  const lat1 = a[0] * rad;
  const lat2 = b[0] * rad;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const aa = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 6371 * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function interpolatePath(path: Array<[number, number]>, progress: number) {
  if (path.length === 0) return null;
  if (path.length === 1) return path[0];

  const clamped = Math.max(0, Math.min(1, progress));
  const segments = path.slice(0, -1).map((point, index) => haversineKm(point, path[index + 1]));
  const total = segments.reduce((sum, value) => sum + value, 0);
  if (total === 0) return path[0];

  const target = total * clamped;
  let accumulated = 0;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const next = accumulated + segment;
    if (target <= next || index === segments.length - 1) {
      const local = segment === 0 ? 0 : (target - accumulated) / segment;
      const start = path[index];
      const end = path[index + 1];
      return [
        start[0] + (end[0] - start[0]) * local,
        start[1] + (end[1] - start[1]) * local,
      ] as [number, number];
    }
    accumulated = next;
  }

  return path[path.length - 1];
}

function bearingBetween(a: [number, number], b: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const toDeg = (value: number) => (value * 180) / Math.PI;
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function makeMarkerHtml({
  label,
  color,
  selected,
  warning,
  type,
}: {
  label: string;
  color: string;
  selected?: boolean;
  warning?: boolean;
  type: MapLocation["type"] | MapRoute["transport"];
}) {
  const borderColor = selected ? "#D5006D" : color;
  const glow = warning
    ? "0 0 20px rgba(255,59,59,0.6)"
    : selected
      ? "0 0 18px rgba(213,0,109,0.55)"
      : `0 0 14px ${color}55`;
  const icon = type === "port" || type === "checkpoint" ? iconForType(type as MapLocation["type"]) : routeIcon(type as MapRoute["transport"]);

  return `
    <div style="
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      display: grid;
      place-items: center;
      background: rgba(10,10,15,0.96);
      border: 2px solid ${borderColor};
      box-shadow: ${glow};
      color: ${borderColor};
      font-size: 18px;
      position: relative;
      animation: ${warning ? "west-map-pulse-alert 1s ease-in-out infinite" : "west-map-pulse 2s ease-in-out infinite"};
    ">
      <div style="
        position: absolute;
        inset: -6px;
        border-radius: 9999px;
        border: 1px solid ${warning ? "rgba(255,59,59,0.7)" : `${borderColor}55`};
        animation: ${warning ? "west-map-pulse-alert 1s ease-in-out infinite" : "west-map-pulse 2s ease-in-out infinite"};
      "></div>
      <span style="position: relative; z-index: 1;">${icon}</span>
    </div>
    <style>
      @keyframes west-map-pulse {
        0%, 100% { transform: scale(1); opacity: .35; }
        50% { transform: scale(1.25); opacity: 0; }
      }
      @keyframes west-map-pulse-alert {
        0%, 100% { transform: scale(1); opacity: .5; }
        50% { transform: scale(1.32); opacity: 0; }
      }
      </style>
    <div style="
      position: absolute;
      left: 50%;
      top: 46px;
      transform: translateX(-50%);
      white-space: nowrap;
      color: #E6E1D6;
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
      text-shadow: 0 2px 6px rgba(0,0,0,0.8);
    ">${label}</div>
  `;
}

export function MapView({
  className,
  center = [42.5, 51.5],
  zoom = 5.2,
  locations = [],
  routes = [],
  locale = "ru",
  selectedLocationId = null,
  onLocationSelect,
}: MapViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const animationRef = useRef<number | null>(null);
  const routeMarkersRef = useRef<Record<string, L.Marker>>({});
  const alertedLocationsRef = useRef<Record<string, boolean>>({});
  const tileLayerUrl = useMemo(
    () => (isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"),
    [isDark],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });

    mapRef.current = map;
    layersRef.current = L.layerGroup().addTo(map);

    L.tileLayer(tileLayerUrl, {
      subdomains: "abcd",
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    }).addTo(map);

    map.setView(center, zoom);

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => map.invalidateSize());
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, [center, tileLayerUrl, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    layers.clearLayers();
    routeMarkersRef.current = {};

    const allPoints: Array<[number, number]> = [];

    locations.forEach((location) => {
      allPoints.push([location.lat, location.lng]);

      const marker = L.marker([location.lat, location.lng], {
        icon: L.divIcon({
          className: "west-map-marker",
          html: makeMarkerHtml({
            label: location.name[locale],
            color: loadColor(location.load),
            selected: selectedLocationId === location.id,
            warning: location.load >= 70,
            type: location.type,
          }),
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -16],
        }),
      });

      marker.on("click", () => onLocationSelect?.(location));
      marker.addTo(layers);

      if (location.load >= 70 && !alertedLocationsRef.current[location.id]) {
        alertedLocationsRef.current[location.id] = true;
        try {
          const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (AudioContextCtor) {
            const audioContext = new AudioContextCtor();
            const beep = (frequency: number, startAt: number) => {
              const oscillator = audioContext.createOscillator();
              const gain = audioContext.createGain();
              oscillator.type = "square";
              oscillator.frequency.value = frequency;
              gain.gain.setValueAtTime(0.0001, audioContext.currentTime + startAt);
              gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + startAt + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + startAt + 0.22);
              oscillator.connect(gain);
              gain.connect(audioContext.destination);
              oscillator.start(audioContext.currentTime + startAt);
              oscillator.stop(audioContext.currentTime + startAt + 0.24);
            };
            beep(880, 0);
            beep(660, 0.18);
            window.setTimeout(() => {
              void audioContext.close();
            }, 900);
          }
        } catch {
          // audio is best-effort; browsers may block autoplay
        }
      }
    });

    routes.forEach((route) => {
      route.path.forEach((point) => allPoints.push(point));
      const routeLabel = route.name?.[locale] ?? route.id;

      const polyline = L.polyline(route.path, {
        color: route.color,
        weight: 4,
        opacity: 0.85,
        lineCap: "round",
        dashArray: "8 10",
      });
      polyline.addTo(layers);

      const marker = L.marker(route.path[0], {
        icon: L.divIcon({
          className: "west-moving-marker",
          html: makeMarkerHtml({
            label: routeLabel,
            color: route.color,
            type: route.transport,
          }),
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -16],
        }),
      });
      marker.addTo(layers);
      routeMarkersRef.current[route.id] = marker;
    });

    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24] });
    }

    const startedAt = performance.now();
    const activeRoutes = routes.map((route) => ({
      route,
      baseProgress: route.progress,
      durationMs: Math.max(12000, (route.path.reduce((sum, point, index) => {
        if (index === route.path.length - 1) return sum;
        return sum + haversineKm(point, route.path[index + 1]);
      }, 0) / Math.max(route.speedKph, 1)) * 3600 * 1000),
    }));

    const tick = (time: number) => {
      const elapsed = time - startedAt;

      activeRoutes.forEach(({ route, baseProgress, durationMs }) => {
        const marker = routeMarkersRef.current[route.id];
        if (!marker) return;

        const travelProgress = Math.min(1, baseProgress + elapsed / durationMs);
        const current = interpolatePath(route.path, travelProgress);
        if (!current) return;

        marker.setLatLng(current);

        const next = interpolatePath(route.path, Math.min(1, travelProgress + 0.01));
        if (next) {
          const iconElement = marker.getElement();
          if (iconElement) {
            const inner = iconElement.querySelector("div > div:last-child");
            if (inner instanceof HTMLElement) {
              inner.style.transform = `translateX(-50%) rotate(${bearingBetween(current, next)}deg)`;
            }
          }
        }
      });

      animationRef.current = window.requestAnimationFrame(tick);
    };

    if (routes.length > 0) {
      animationRef.current = window.requestAnimationFrame(tick);
    }

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [locale, locations, onLocationSelect, routes, selectedLocationId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  return <div ref={containerRef} className={cn("w-full h-[500px] rounded-2xl overflow-hidden", className)} />;
}
