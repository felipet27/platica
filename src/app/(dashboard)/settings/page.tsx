"use client";

import { useSettings, CURRENCIES } from "@/contexts/SettingsContext";
import { Settings, Check } from "lucide-react";

export default function SettingsPage() {
  const { currency, setCurrency } = useSettings();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Personaliza cómo se muestra tu información</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Moneda</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Selecciona la moneda en la que quieres ver todos los valores de la app.
          </p>
          <div className="space-y-2">
            {CURRENCIES.map(({ code, label, symbol }) => {
              const active = currency === code;
              return (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                    active
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 text-center ${active ? "text-green-700" : "text-gray-400"}`}>
                      {symbol}
                    </span>
                    <div>
                      <p className={`font-medium ${active ? "text-green-900" : "text-gray-700"}`}>{label}</p>
                      <p className="text-xs text-gray-400">{code}</p>
                    </div>
                  </div>
                  {active && <Check className="w-5 h-5 text-green-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
