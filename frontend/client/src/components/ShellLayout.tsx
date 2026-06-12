import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronRight, Globe, LogOut, Menu, Moon, Sun, Zap, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import type { BackendUser } from "@/lib/backend";
import { roleLabel, type RoleSection } from "@/config/roleShells";

interface ShellLayoutProps {
  user: BackendUser;
  homePath: string;
  sections: RoleSection[];
  showSidebar: boolean;
  onLogout: () => void;
  children: ReactNode;
}

const languages = [
  { code: "ru" as const, label: "RU", full: "Русский" },
  { code: "kz" as const, label: "KZ", full: "Қазақша" },
  { code: "en" as const, label: "EN", full: "English" },
];

export default function ShellLayout({ user, homePath, sections, showSidebar, onLogout, children }: ShellLayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme, visualMode, toggleVisualMode } = useTheme();
  const { lang, setLang } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const isDark = theme === "dark";

  const sidebarWidth = showSidebar ? 240 : 0;
  const roleName = useMemo(() => roleLabel(user.role, lang), [lang, user.role]);
  const initials = (user.name || user.username || user.email || "W")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLangChange = (code: typeof lang) => {
    setLang(code);
    setShowLangMenu(false);
    toast.success(lang === "ru" ? "Язык изменён" : lang === "kz" ? "Тіл өзгертілді" : "Language changed", {
      duration: 2000,
      style: {
        background: isDark ? "#111A2E" : "#fff",
        border: "1px solid rgba(200,169,106,0.3)",
        color: isDark ? "#E6E1D6" : "#1E2A3A",
      },
    });
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "" : "light"}`} style={{ background: isDark ? "#0B1220" : "#F0E9DD" }}>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{
          background: isDark ? "rgba(11,18,32,0.92)" : "rgba(240,233,221,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: isDark ? "1px solid rgba(200,169,106,0.15)" : "1px solid rgba(47,74,109,0.15)",
        }}
      >
        <div className="flex items-center gap-3">
          {showSidebar ? (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-md transition-colors"
              style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          ) : null}
          <Link href={homePath} className="flex items-center gap-2 no-underline">
            <div className="flex items-center gap-1.5">
              <Zap size={18} style={{ color: "#C8A96A", filter: "drop-shadow(0 0 8px rgba(200,169,106,0.5))" }} />
              <span className="logo-text text-xl tracking-widest">WEST</span>
            </div>
          </Link>
          <span
            className="hidden sm:block text-xs font-mono px-2 py-0.5 rounded"
            style={{
              color: isDark ? "#B8B0A2" : "#5C6B7A",
              background: isDark ? "rgba(34,49,79,0.6)" : "rgba(92,107,122,0.1)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {roleName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all"
              style={{
                color: isDark ? "#B8B0A2" : "#5C6B7A",
                background: isDark ? "rgba(34,49,79,0.5)" : "rgba(92,107,122,0.08)",
                border: isDark ? "1px solid rgba(34,49,79,0.8)" : "1px solid rgba(92,107,122,0.2)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Globe size={13} />
              <span>{lang.toUpperCase()}</span>
            </button>
            {showLangMenu && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50 min-w-[120px]"
                style={{
                  background: isDark ? "#111A2E" : "#fff",
                  border: isDark ? "1px solid rgba(200,169,106,0.25)" : "1px solid rgba(47,74,109,0.2)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}
              >
                {languages.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleLangChange(item.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
                    style={{
                      color: lang === item.code ? "#C8A96A" : (isDark ? "#B8B0A2" : "#5C6B7A"),
                      background: lang === item.code ? "rgba(200,169,106,0.1)" : "transparent",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <span className="font-mono text-xs w-6">{item.label}</span>
                    <span>{item.full}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md transition-all"
            title={isDark ? "Light Theme" : "Dark Theme"}
            style={{
              color: isDark ? "#B8B0A2" : "#5C6B7A",
              background: isDark ? "rgba(34,49,79,0.5)" : "rgba(92,107,122,0.08)",
              border: isDark ? "1px solid rgba(34,49,79,0.8)" : "1px solid rgba(92,107,122,0.2)",
            }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={toggleVisualMode}
            className="p-2 rounded-md transition-all"
            title={visualMode === "cyber" ? "Disable cyber mode" : "Enable cyber mode"}
            style={{
              color: visualMode === "cyber" ? "#FF3B3B" : (isDark ? "#B8B0A2" : "#5C6B7A"),
              background: visualMode === "cyber" ? "rgba(213,0,109,0.12)" : (isDark ? "rgba(34,49,79,0.5)" : "rgba(92,107,122,0.08)"),
              border: visualMode === "cyber" ? "1px solid rgba(213,0,109,0.35)" : (isDark ? "1px solid rgba(34,49,79,0.8)" : "1px solid rgba(92,107,122,0.2)"),
              boxShadow: visualMode === "cyber" ? "0 0 16px rgba(213,0,109,0.25)" : undefined,
            }}
          >
            <Zap size={16} />
          </button>

          <button
            onClick={onLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              fontFamily: "'Manrope', sans-serif",
              color: isDark ? "#E6E1D6" : "#1E2A3A",
              background: isDark ? "rgba(34,49,79,0.5)" : "rgba(92,107,122,0.08)",
              border: isDark ? "1px solid rgba(34,49,79,0.8)" : "1px solid rgba(92,107,122,0.2)",
            }}
          >
            <LogOut size={14} />
            <span>{lang === "ru" ? "Выйти" : lang === "kz" ? "Шығу" : "Logout"}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14">
        {showSidebar && sections.length > 0 ? (
          <>
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-30 lg:hidden"
                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                onClick={() => setSidebarOpen(false)}
              />
            )}

            <aside
              className={`fixed left-0 top-14 bottom-0 z-40 flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-200
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              `}
              style={{
                width: "240px",
                background: isDark ? "#0B1220" : "#F5F0E6",
                borderRight: isDark ? "1px solid rgba(34,49,79,0.8)" : "1px solid rgba(47,74,109,0.12)",
              }}
            >
              <div className="flex flex-col flex-1 p-3 gap-1">
                {sections.map((section) => (
                  <div key={section.title} className="mb-1">
                    <div
                      className="px-2 py-1 text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{
                        color: isDark ? "rgba(184,176,162,0.5)" : "rgba(92,107,122,0.5)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px",
                      }}
                    >
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.path;
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`nav-item ${isActive ? "active" : ""}`}
                        >
                          <Icon size={17} style={{ flexShrink: 0 }} />
                          <span className="nav-label">{item.label}</span>
                          {isActive && <ChevronRight size={14} className="ml-auto" style={{ color: "#C8A96A" }} />}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </aside>
          </>
        ) : null}

        <main
          className="flex-1 min-h-0 overflow-auto"
          style={{ marginLeft: sidebarWidth }}
        >
          <style>{`
            @media (max-width: 1023px) {
              main { margin-left: 0 !important; }
            }
          `}</style>
          <div className="px-4 pt-4">
            <div
              className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
              style={{
                background: isDark ? "rgba(17,26,46,0.9)" : "rgba(255,255,255,0.8)",
                borderColor: isDark ? "rgba(34,49,79,0.8)" : "rgba(47,74,109,0.12)",
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl font-semibold"
                style={{
                  background: isDark ? "rgba(200,169,106,0.16)" : "rgba(47,74,109,0.08)",
                  color: isDark ? "#E6E1D6" : "#1E2A3A",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="truncate text-sm font-semibold" style={{ color: isDark ? "#E6E1D6" : "#1E2A3A" }}>
                    {user.name}
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] uppercase tracking-widest"
                    style={{
                      background: isDark ? "rgba(200,169,106,0.14)" : "rgba(92,107,122,0.08)",
                      color: isDark ? "#C8A96A" : "#5C6B7A",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {roleName}
                  </span>
                </div>
                <div className="truncate text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                  {user.email} · {user.company || (lang === "ru" ? "Без компании" : lang === "kz" ? "Компаниясыз" : "No company")}
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <div className="text-xs" style={{ color: isDark ? "#B8B0A2" : "#5C6B7A" }}>
                  {lang === "ru" ? "Доступы" : lang === "kz" ? "Қолжетімділік" : "Capabilities"}
                </div>
                <div className="text-sm font-semibold" style={{ color: isDark ? "#E6E1D6" : "#1E2A3A" }}>
                  {user.capabilities?.length ?? 0}
                </div>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>

      {showLangMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
      )}
    </div>
  );
}
