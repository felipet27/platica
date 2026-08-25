"use client";

import { Sun, Moon } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useSettings();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors ${className}`}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
