"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

export const CURRENCIES = [
  { code: "COP", label: "Peso colombiano", symbol: "$" },
  { code: "USD", label: "Dólar estadounidense", symbol: "US$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "MXN", label: "Peso mexicano", symbol: "MX$" },
  { code: "BRL", label: "Real brasileño", symbol: "R$" },
];

interface SettingsCtx {
  currency: string;
  setCurrency: (c: string) => void;
  fmt: (amount: number) => string;
  currencies: typeof CURRENCIES;
}

const SettingsContext = createContext<SettingsCtx>({
  currency: "COP",
  setCurrency: () => {},
  fmt: (n) => formatCurrency(n, "COP"),
  currencies: CURRENCIES,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("platica_currency") ?? "COP";
    }
    return "COP";
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.currency) {
          setCurrencyState(data.currency);
          localStorage.setItem("platica_currency", data.currency);
        }
      })
      .catch(() => {});
  }, []);

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
    <SettingsContext.Provider value={{ currency, setCurrency, fmt, currencies: CURRENCIES }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
