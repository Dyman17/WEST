export type LocaleCode = "ru" | "kz" | "en";

export interface LocalizedText {
  ru: string;
  kz: string;
  en: string;
}

export interface MapLocation {
  id: string;
  name: LocalizedText;
  lat: number;
  lng: number;
  type: "port" | "checkpoint";
  load: number;
  queue: number;
  waitHours: number;
  transport: Array<"ships" | "trucks" | "trains">;
}

export interface MapRoute {
  id: string;
  name?: LocalizedText;
  color: string;
  transport: "truck" | "ship" | "train";
  path: Array<[number, number]>;
  speedKph: number;
  progress: number;
}

export const MAP_LOCATIONS: MapLocation[] = [
  {
    id: "aktau-port",
    name: { ru: "Порт Актау", kz: "Ақтау порты", en: "Aktau Port" },
    lat: 43.6525,
    lng: 51.1575,
    type: "port",
    load: 88,
    queue: 24,
    waitHours: 3.5,
    transport: ["ships", "trucks"],
  },
  {
    id: "kuryk-port",
    name: { ru: "Порт Курык", kz: "Құрық порты", en: "Kuryk Port" },
    lat: 43.2,
    lng: 51.65,
    type: "port",
    load: 45,
    queue: 8,
    waitHours: 1,
    transport: ["ships", "trucks"],
  },
  {
    id: "baku-port",
    name: { ru: "Порт Баку", kz: "Баку порты", en: "Baku Port" },
    lat: 40.2343,
    lng: 49.5256,
    type: "port",
    load: 65,
    queue: 15,
    waitHours: 2,
    transport: ["ships"],
  },
  {
    id: "turkmenbashi-port",
    name: { ru: "Туркменбаши", kz: "Түрікменбашы", en: "Turkmenbashi Port" },
    lat: 40,
    lng: 53.033,
    type: "port",
    load: 72,
    queue: 18,
    waitHours: 2.5,
    transport: ["ships", "trucks"],
  },
  {
    id: "kpp-bekdash",
    name: { ru: "КПП Бекдаш", kz: "Бекдаш КПП", en: "Bekdash Checkpoint" },
    lat: 41.5,
    lng: 52.5,
    type: "checkpoint",
    load: 55,
    queue: 10,
    waitHours: 1.5,
    transport: ["trucks"],
  },
  {
    id: "kpp-karakalpak",
    name: { ru: "КПП Каракалпак", kz: "Қарақалпақ КПП", en: "Karakalpak Checkpoint" },
    lat: 42.5,
    lng: 54,
    type: "checkpoint",
    load: 30,
    queue: 5,
    waitHours: 0.5,
    transport: ["trucks", "trains"],
  },
];

export const MAP_ROUTES: MapRoute[] = [
  {
    id: "aktau-baku",
    name: { ru: "Актау → Баку", kz: "Ақтау → Баку", en: "Aktau → Baku" },
    color: "#C8A96A",
    transport: "ship",
    path: [
      [43.6525, 51.1575],
      [43.1, 50.7],
      [42.4, 50.0],
      [41.5, 49.6],
      [40.2343, 49.5256],
    ],
    speedKph: 42,
    progress: 0.62,
  },
  {
    id: "kuryk-turkmenbashi",
    name: { ru: "Курык → Туркменбаши", kz: "Құрық → Түрікменбашы", en: "Kuryk → Turkmenbashi" },
    color: "#4FBF9F",
    transport: "ship",
    path: [
      [43.2, 51.65],
      [42.7, 52.1],
      [41.8, 52.55],
      [40.7, 52.8],
      [40, 53.033],
    ],
    speedKph: 38,
    progress: 0.38,
  },
  {
    id: "aktau-kuryk",
    name: { ru: "Актау → Курык", kz: "Ақтау → Құрық", en: "Aktau → Kuryk" },
    color: "#E0C27A",
    transport: "truck",
    path: [
      [43.6525, 51.1575],
      [43.5, 51.32],
      [43.35, 51.48],
      [43.2, 51.65],
    ],
    speedKph: 55,
    progress: 0.78,
  },
  {
    id: "aktau-almaty",
    name: { ru: "Актау → Алматы", kz: "Ақтау → Алматы", en: "Aktau → Almaty" },
    color: "#6FA3FF",
    transport: "train",
    path: [
      [43.6525, 51.1575],
      [44.5, 55.4],
      [44.0, 61.2],
      [43.5, 67.1],
      [43.233, 76.95],
    ],
    speedKph: 62,
    progress: 0.44,
  },
];

export const TRACKING_ROUTES: Record<
  string,
  {
    color: string;
    transport: "truck" | "ship" | "train";
    path: Array<[number, number]>;
    speedKph: number;
    progress: number;
  }
> = {
  "ORD-2024-001": {
    color: "#6FA3FF",
    transport: "ship",
    path: [
      [43.6525, 51.1575],
      [43.2, 51.05],
      [42.3, 50.7],
      [41.4, 50.0],
      [40.2343, 49.5256],
    ],
    speedKph: 40,
    progress: 0.65,
  },
  "ORD-2024-002": {
    color: "#4FBF9F",
    transport: "ship",
    path: [
      [43.2, 51.65],
      [42.7, 52.1],
      [41.8, 52.55],
      [40.9, 52.85],
      [40, 53.033],
    ],
    speedKph: 36,
    progress: 0.82,
  },
  "ORD-2024-003": {
    color: "#E0C27A",
    transport: "train",
    path: [
      [43.6525, 51.1575],
      [44.5, 55.4],
      [44, 61.2],
      [43.5, 67.1],
      [43.233, 76.95],
    ],
    speedKph: 58,
    progress: 1,
  },
};
