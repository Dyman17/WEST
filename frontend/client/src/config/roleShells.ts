import type { CSSProperties, ComponentType } from "react";
import type { BackendUserRole } from "@/lib/backend";
import {
  Anchor,
  ArrowLeftRight,
  GraduationCap,
  Layers,
  Map,
  Navigation,
  Plus,
  Star,
  Users,
} from "lucide-react";
import BackhaulPage from "@/pages/BackhaulPage";
import BookingPage from "@/pages/BookingPage";
import CarriersPage from "@/pages/CarriersPage";
import CreateOrderPage from "@/pages/CreateOrderPage";
import DashboardPage from "@/pages/DashboardPage";
import MapPage from "@/pages/MapPage";
import RatingPage from "@/pages/RatingPage";
import TinderPage from "@/pages/TinderPage";
import TrackingPage from "@/pages/TrackingPage";

export interface RoleNavItem {
  path: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;
}

export interface RoleSection {
  title: string;
  items: RoleNavItem[];
}

export interface RoleShellConfig {
  homePath: string;
  showSidebar: boolean;
  sections: RoleSection[];
  routes: Array<{ path: string; component: ComponentType }>;
}

const carrierConfig: RoleShellConfig = {
  homePath: "/map",
  showSidebar: true,
  sections: [
    {
      title: "Carrier",
      items: [
        { path: "/map", label: "Карта", icon: Map },
        { path: "/tinder", label: "Freight Tinder", icon: Layers },
        { path: "/backhaul", label: "Backhaul", icon: ArrowLeftRight },
        { path: "/booking", label: "Бронь порта", icon: Anchor },
        { path: "/rating", label: "Рейтинг", icon: Star },
        { path: "/tracking", label: "Трекинг", icon: Navigation },
      ],
    },
  ],
  routes: [
    { path: "/map", component: MapPage },
    { path: "/tinder", component: TinderPage },
    { path: "/backhaul", component: BackhaulPage },
    { path: "/booking", component: BookingPage },
    { path: "/rating", component: RatingPage },
    { path: "/tracking", component: TrackingPage },
  ],
};

const shipperConfig: RoleShellConfig = {
  homePath: "/create-order",
  showSidebar: true,
  sections: [
    {
      title: "Shipper",
      items: [
        { path: "/create-order", label: "Создать заявку", icon: Plus },
        { path: "/carriers", label: "Перевозчики", icon: Users },
        { path: "/tracking", label: "Трекинг", icon: Navigation },
        { path: "/rating", label: "Рейтинг", icon: Star },
      ],
    },
  ],
  routes: [
    { path: "/create-order", component: CreateOrderPage },
    { path: "/carriers", component: CarriersPage },
    { path: "/tracking", component: TrackingPage },
    { path: "/rating", component: RatingPage },
  ],
};

const adminConfig: RoleShellConfig = {
  homePath: "/dashboard",
  showSidebar: false,
  sections: [],
  routes: [{ path: "/dashboard", component: DashboardPage }],
};

export const ROLE_SHELLS: Record<BackendUserRole, RoleShellConfig> = {
  admin: adminConfig,
  shipper: shipperConfig,
  carrier: carrierConfig,
};

export function getRoleShell(role: BackendUserRole) {
  return ROLE_SHELLS[role] ?? shipperConfig;
}

export function roleLabel(role: BackendUserRole, lang: "ru" | "kz" | "en") {
  switch (role) {
    case "admin":
      return lang === "ru" ? "Акимат" : lang === "kz" ? "Әкімдік" : "Akimat";
    case "shipper":
      return lang === "ru" ? "Отправитель" : lang === "kz" ? "Жіберуші" : "Shipper";
    case "carrier":
      return lang === "ru" ? "Перевозчик" : lang === "kz" ? "Тасымалдаушы" : "Carrier";
    default:
      return role;
  }
}
