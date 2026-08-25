"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";

type CatType = "income" | "expense";
interface CustomCategories {
  income: string[];
  expense: string[];
}

export const CURRENCIES = [
  { code: "COP", label: "Peso colombiano", symbol: "$" },
  { code: "USD", label: "Dólar estadounidense", symbol: "US$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "MXN", label: "Peso mexicano", symbol: "MX$" },
  { code: "BRL", label: "Real brasileño", symbol: "R$" },
];

type Theme = "light" | "dark";

interface SettingsCtx {
  currency: string;
  setCurrency: (c: string) => void;
  fmt: (amount: number) => string;
  currencies: typeof CURRENCIES;
  customCategories: CustomCategories;
  categoriesFor: (type: CatType) => string[];
  addCategory: (type: CatType, name: string) => Promise<void>;
  removeCategory: (type: CatType, name: string) => Promise<void>;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const SettingsContext = createContext<SettingsCtx>({
  currency: "COP",
  setCurrency: () => {},
  fmt: (n) => formatCurrency(n, "COP"),
  currencies: CURRENCIES,
  customCategories: { income: [], expense: [] },
  categoriesFor: (type) => [...CATEGORIES[type]],
  addCategory: async () => {},
  removeCategory: async () => {},
  theme: "light",
  setTheme: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("platica_currency") ?? "COP";
    }
    return "COP";
  });

  const [customCategories, setCustomCategories] = useState<CustomCategories>({ income: [], expense: [] });

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("platica_theme") as Theme) ?? "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("platica_theme", t);
  }

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.currency) {
          setCurrencyState(data.currency);
          localStorage.setItem("platica_currency", data.currency);
        }
        if (data.customCategories) {
          setCustomCategories({
            income: data.customCategories.income ?? [],
            expense: data.customCategories.expense ?? [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const categoriesFor = useCallback(
    (type: CatType) => [...CATEGORIES[type], ...customCategories[type]],
    [customCategories]
  );

  async function persistCategories(next: CustomCategories) {
    setCustomCategories(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customCategories: next }),
    }).catch(() => {});
  }

  async function addCategory(type: CatType, name: string) {
    const clean = name.trim();
    if (!clean) return;
    // Evita duplicar categorías existentes (predefinidas o propias)
    const exists = [...CATEGORIES[type], ...customCategories[type]].some(
      (c) => c.toLowerCase() === clean.toLowerCase()
    );
    if (exists) return;
    await persistCategories({ ...customCategories, [type]: [...customCategories[type], clean] });
  }

  async function removeCategory(type: CatType, name: string) {
    await persistCategories({
      ...customCategories,
      [type]: customCategories[type].filter((c) => c !== name),
    });
  }

  function setCurrency(c: string) {
    setCurrencyState(c);
    localStorage.setItem("platica_currency", c);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: c }),
    }).catch(() => {});
  }

  const fmt = (amount: number) => formatCurrency(amount, currency);

  return (
    <SettingsContext.Provider
      value={{
        currency,
        setCurrency,
        fmt,
        currencies: CURRENCIES,
        customCategories,
        categoriesFor,
        addCategory,
        removeCategory,
        theme,
        setTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
