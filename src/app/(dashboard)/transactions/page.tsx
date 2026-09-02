"use client";

import { useState, useEffect, useCallback } from "react";
import { PenLine, Trash2, Filter, X, CalendarDays, Search, Pencil, SlidersHorizontal, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { todayISO } from "@/lib/date";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";
import { MoneyInput } from "@/components/ui/MoneyInput";

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
  date: todayISO(),
  commitmentId: "",
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function TransactionsPage() {
  const { fmt, categoriesFor } = useSettings();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput, 350);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commitments, setCommitments] = useState<CommitmentOption[]>([]);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const activeFilterCount = [filterCategory, filterFrom, filterTo].filter(Boolean).length;
  const allCategories = [...new Set([...categoriesFor("income"), ...categoriesFor("expense")])];

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
    if (filterCategory) params.set("category", filterCategory);
    if (search) params.set("search", search);
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo) params.set("to", filterTo);
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [page, filterType, filterCategory, search, filterFrom, filterTo]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Volver a la página 1 cuando cambian filtros o búsqueda
  useEffect(() => { setPage(1); }, [filterType, filterCategory, search, filterFrom, filterTo]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      description: t.description,
      date: t.date.slice(0, 10),
      commitmentId: "",
    });
    setShowForm(true);
  }

  function clearFilters() {
    setFilterCategory("");
    setFilterFrom("");
    setFilterTo("");
  }

  const categories = categoriesFor(form.type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    if (editing) {
      await fetch(`/api/transactions/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description,
          date: form.date,
          tags: [],
        }),
      });
    } else {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: [],
          commitmentId: form.commitmentId || undefined,
        }),
      });
    }
    setForm(EMPTY_FORM);
    setEditing(null);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
            <PageInfoTooltip text="Historial de todos tus movimientos. Anota aquí gastos del día a día, salidas, viajes — con la fecha real en que ocurrieron, aunque los registres después." />
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/transactions/export${
                filterFrom || filterTo
                  ? `?${new URLSearchParams({
                      ...(filterFrom ? { from: filterFrom } : {}),
                      ...(filterTo ? { to: filterTo } : {}),
                    })}`
                  : ""
              }`}
              className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              title="Descargar movimientos en CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </a>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <PenLine className="w-4 h-4" />
              Anotar movimiento
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {total} movimientos en total · Todos tus movimientos reales, incluidos los pagos de{" "}
          <Link href="/commitments" className="text-green-700 font-medium hover:underline">Compromisos</Link> y los gastos variables.
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por descripción..."
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtros por tipo + botón filtros avanzados */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {(["", "income", "expense"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === t
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t === "" ? "Todos" : t === "income" ? "Ingresos" : "Gastos"}
          </button>
        ))}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeFilterCount > 0 || showFilters
              ? "bg-green-50 text-green-700 border border-green-300"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-green-600 text-white text-xs px-1.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
            >
              <option value="">Todas</option>
              {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm text-gray-700"
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="sm:col-span-3 justify-self-start text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Modal anotar movimiento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editing ? "Editar movimiento" : "Anotar movimiento"}
            </h2>
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
                <MoneyInput
                  required
                  value={form.amount}
                  onChange={(v) => setForm({ ...form, amount: v })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
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
                  placeholder="Ej: Cena en restaurante, gasolina, entrada al cine..."
                />
              </div>

              {!editing && commitments.filter((c) => c.type === form.type).length > 0 && (
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

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium text-blue-800">¿Cuándo ocurrió realmente?</span>
                </div>
                <input
                  type="date"
                  required
                  max={todayISO()}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm text-gray-700"
                />
                <p className="text-xs text-blue-500 mt-1.5">Puedes cambiarlo si lo estás anotando después.</p>
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
                  {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Guardar"}
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
          <div className="text-center py-12 text-gray-400">
            {search || activeFilterCount > 0 || filterType
              ? "No hay movimientos que coincidan con la búsqueda o filtros."
              : "No hay transacciones"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Descripción", "Categoría", "Fecha", "Monto", ""].map((h) => (
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
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "income"
                          ? <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          : <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />}
                        <span className="sr-only">{t.type === "income" ? "Ingreso" : "Gasto"}: </span>
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                          aria-label="Editar transacción"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTransaction(t)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          aria-label="Eliminar transacción"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
