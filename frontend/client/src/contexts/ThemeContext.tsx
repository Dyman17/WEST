import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type VisualMode = "standard" | "cyber";

interface ThemeContextType {
  theme: Theme;
  visualMode: VisualMode;
  toggleTheme?: () => void;
  toggleVisualMode?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });
  const [visualMode, setVisualMode] = useState<VisualMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("visualMode");
      return (stored as VisualMode) || "standard";
    }
    return "standard";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.toggle("cyber", visualMode === "cyber");
    body.classList.toggle("cyber", visualMode === "cyber");

    if (switchable) {
      localStorage.setItem("visualMode", visualMode);
    }
  }, [switchable, visualMode]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const toggleVisualMode = switchable
    ? () => {
        setVisualMode((prev) => (prev === "standard" ? "cyber" : "standard"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, visualMode, toggleTheme, toggleVisualMode, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
