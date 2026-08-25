"use client";

import { useState } from "react";
import { Tag, Plus, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function CategoryManager() {
  const { customCategories, addCategory, removeCategory } = useSettings();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addCategory(type, name);
    setName("");
    setSaving(false);
  }

  const list = customCategories[type];

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Tag className="w-5 h-5 text-gray-400" />
        <h2 className="font-semibold text-gray-900">Categorías propias</h2>
      </div>
      <div className="p-6">
        <p className="text-sm text-gray-500 mb-4">
          Crea tus propias categorías para clasificar gastos e ingresos a tu manera. Aparecerán en los formularios junto a las predefinidas.
        </p>

        {/* Selector tipo */}
        <div className="flex gap-2 mb-4">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                type === t
                  ? t === "income"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {t === "income" ? "Ingresos" : "Gastos"}
            </button>
          ))}
        </div>

        {/* Formulario agregar */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder={type === "income" ? "Ej: Arriendos, Dividendos" : "Ej: Mascota, Gimnasio"}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </form>

        {/* Lista de categorías propias */}
        {list.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Aún no tienes categorías propias de {type === "income" ? "ingresos" : "gastos"}.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {list.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {c}
                <button
                  onClick={() => removeCategory(type, c)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Eliminar categoría ${c}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4">
          Eliminar una categoría no borra los movimientos que ya la usan; solo deja de ofrecerla en los formularios.
        </p>
      </div>
    </div>
  );
}
