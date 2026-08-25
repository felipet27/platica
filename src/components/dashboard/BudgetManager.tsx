"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, Trash2, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { CATEGORIES } from "@/lib/categories";
import { MoneyInput } from "@/components/ui/MoneyInput";

interface Budget {
  _id: string;
  category: string;
  limit: number;
  spent: number;
}

export function BudgetManager() {
  const { fmt } = useSettings();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/budgets");
    const data = await res.json();
    setBudgets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  // Categorías que aún no tienen presupuesto
  const available = CATEGORIES.expense.filter(
    (c) => !budgets.some((b) => b.category === c)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !limit) return;
    setSubmitting(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit: parseFloat(limit) }),
    });
    setCategory("");
    setLimit("");
    setShowForm(false);
    setSubmitting(false);
    fetchBudgets();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await fetch(`/api/budgets/${deleting._id}`, { method: "DELETE" });
    setDeleting(null);
    fetchBudgets();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Topes por categoría
        </h2>
        {available.length > 0 && (
          <button
            onClick={() => { setShowForm(true); setCategory(available[0]); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo tope
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-xs text-gray-400 mb-4">
          Define cuánto quieres gastar como máximo en una categoría cada mes. Te avisamos cuando te acerques o te pases.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
        ) : budgets.length === 0 ? (
          <div className="text-center py-6">
            <Wallet className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aún no tienes topes configurados.</p>
            <p className="text-xs text-gray-400 mt-1">Empieza por tu categoría de mayor gasto (mercado, restaurantes, ocio).</p>
          </div>
        ) : (
          <div className="space-y-5">
            {budgets.map((b) => {
              const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
              const over = b.spent > b.limit;
              const near = !over && pct >= 80;
              const barColor = over ? "bg-red-500" : near ? "bg-amber-400" : "bg-green-500";
              const remaining = b.limit - b.spent;
              return (
                <div key={b._id}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{b.category}</span>
                      {over ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                          <AlertTriangle className="w-3 h-3" /> Te pasaste
                        </span>
                      ) : near ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                          <AlertTriangle className="w-3 h-3" /> Cerca del tope
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <CheckCircle2 className="w-3 h-3" /> En control
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {fmt(b.spent)} <span className="text-gray-300">/</span> {fmt(b.limit)}
                      </span>
                      <button
                        onClick={() => setDeleting(b)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        aria-label={`Eliminar tope de ${b.category}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className={`text-xs mt-1 ${over ? "text-red-500" : "text-gray-400"}`}>
                    {over
                      ? `Te pasaste por ${fmt(b.spent - b.limit)}`
                      : `Te quedan ${fmt(remaining)} este mes`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal nuevo tope */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo tope mensual</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {available.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tope mensual</label>
                <MoneyInput
                  required
                  value={limit}
                  onChange={(v) => setLimit(v)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Eliminar tope</h2>
              <button onClick={() => setDeleting(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              ¿Seguro que quieres eliminar el tope de <span className="font-medium text-gray-700">{deleting.category}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
