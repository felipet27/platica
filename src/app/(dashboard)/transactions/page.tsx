"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Filter, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { CATEGORIES } from "@/lib/categories";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  tags: string[];
  date: string;
}

interface CommitmentOption {
  _id: string;
  name: string;
  type: "income" | "expense";
  isActive: boolean;
}

const EMPTY_FORM = {
  type: "expense" as "income" | "expense",
  amount: "",
  category: "",
  description: "",
  tags: "",
  date: new Date().toISOString().slice(0, 10),
  commitmentId: "",
};

export default function TransactionsPage() {
  const { fmt } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commitments, setCommitments] = useState<CommitmentOption[]>([]);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/commitments")
      .then((r) => r.json())
      .then((data) => setCommitments(Array.isArray(data) ? data.filter((c: CommitmentOption) => c.isActive) : []))
      .catch(() => {});
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (filterType) params.set("type", filterType);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [page, filterType]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const categories = CATEGORIES[form.type];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        commitmentId: form.commitmentId || undefined,
      }),
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSubmitting(false);
    fetchTransactions();
  }

  async function confirmDelete() {
    if (!deleteTransaction) return;
    setDeleteSubmitting(true);
    await fetch(`/api/transactions/${deleteTransaction._id}`, { method: "DELETE" });
    setDeleteTransaction(null);
    setDeleteSubmitting(false);
    fetchTransactions();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <PageInfoTooltip text="Historial completo de todos tus movimientos de dinero: ingresos y gastos. Filtra por mes, tipo o categoría para analizar cualquier período. Cada transacción que registras alimenta el balance, los gráficos y los consejos del Dashboard." />
        </div>
        <p className="text-gray-500 text-sm mt-1">{total} transacciones en total</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        {(["", "income", "expense"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setFilterType(t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === t
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t === "" ? "Todos" : t === "income" ? "Ingresos" : "Gastos"}
          </button>
        ))}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Nueva transacción</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, category: "", commitmentId: "" })}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                      form.type === t
                        ? t === "income"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t === "income" ? "Ingreso" : "Gasto"}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-400 mt-1">Si usas decimales, separa con punto (.). Ej: 150000.50</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Descripción de la transacción"
                />
              </div>

              {commitments.filter((c) => c.type === form.type).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compromiso <span className="text-gray-400">(opcional)</span>
                  </label>
                  <select
                    value={form.commitmentId}
                    onChange={(e) => setForm({ ...form, commitmentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Sin compromiso</option>
                    {commitments
                      .filter((c) => c.type === form.type)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas <span className="text-gray-400">(separadas por coma)</span></label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="trabajo, personal, urgente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
      {deleteTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Eliminar transacción</h2>
              <button onClick={() => setDeleteTransaction(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              ¿Seguro que quieres eliminar esta transacción?
            </p>
            <p className="text-sm font-medium text-gray-700 mb-6">&quot;{deleteTransaction.description}&quot;</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTransaction(null)}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {deleteSubmitting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No hay transacciones</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Descripción", "Categoría", "Fecha", "Etiquetas", "Monto", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{t.description}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{t.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setDeleteTransaction(t)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">Página {page} de {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
