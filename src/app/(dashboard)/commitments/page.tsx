"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { CATEGORIES } from "@/lib/categories";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";
import { MoneyInput } from "@/components/ui/MoneyInput";

interface Commitment {
  _id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  expenseType?: "fixed" | "variable";
  incomeType?: "fixed" | "variable";
  frequency?: "monthly" | "biweekly";
  category: string;
  isActive: boolean;
  payDay?: number;
  totalInstallments?: number;
  installmentsPaid?: number;
  month?: string;
}

const EMPTY_FORM = {
  name: "",
  amount: "",
  type: "expense" as "income" | "expense",
  expenseType: "fixed" as "fixed" | "variable",
  incomeType: "fixed" as "fixed" | "variable",
  frequency: "monthly" as "monthly" | "biweekly",
  category: "",
  payDay: "",
  totalInstallments: "",
};

function toYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const label = new Date(y, m - 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Commitment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteCommitment, setDeleteCommitment] = useState<Commitment | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => toYearMonth(new Date()));

  const fetchCommitments = useCallback(async () => {
    const res = await fetch("/api/commitments");
    const data = await res.json();
    setCommitments(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchCommitments();
  }, [fetchCommitments]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openCreateVariable() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, type: "expense", expenseType: "variable" });
    setShowForm(true);
  }

  function openEdit(c: Commitment) {
    setEditing(c);
    setForm({
      name: c.name,
      amount: String(c.amount),
      type: c.type,
      expenseType: c.expenseType ?? "fixed",
      incomeType: c.incomeType ?? "fixed",
      frequency: c.frequency ?? "monthly",
      category: c.category,
      payDay: c.payDay ? String(c.payDay) : "",
      totalInstallments: c.totalInstallments ? String(c.totalInstallments) : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const isVariableExpense = form.type === "expense" && form.expenseType === "variable";

    const body = {
      name: form.name,
      amount: parseFloat(form.amount),
      type: form.type,
      ...(form.type === "expense" ? { expenseType: form.expenseType } : {}),
      ...(form.type === "income" ? { incomeType: form.incomeType, frequency: form.frequency } : {}),
      ...(isVariableExpense ? { month: selectedMonth } : {}),
      category: form.category,
      ...(!isVariableExpense && form.payDay ? { payDay: parseInt(form.payDay) } : {}),
      ...(!isVariableExpense && form.totalInstallments ? { totalInstallments: parseInt(form.totalInstallments) } : {}),
    };

    if (editing) {
      await fetch(`/api/commitments/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setShowForm(false);
    setSubmitting(false);
    fetchCommitments();
  }

  async function confirmDelete() {
    if (!deleteCommitment) return;
    setDeleteSubmitting(true);
    await fetch(`/api/commitments/${deleteCommitment._id}`, { method: "DELETE" });
    setDeleteCommitment(null);
    setDeleteSubmitting(false);
    fetchCommitments();
  }

  async function toggleActive(c: Commitment) {
    await fetch(`/api/commitments/${c._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    fetchCommitments();
  }

  function prevMonth() {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(toYearMonth(new Date(y, m - 2)));
  }

  function nextMonth() {
    const [y, m] = selectedMonth.split("-").map(Number);
    setSelectedMonth(toYearMonth(new Date(y, m)));
  }

  const { fmt } = useSettings();
  const categories = CATEGORIES[form.type];
  const isVariableExpenseForm = form.type === "expense" && form.expenseType === "variable";
  const currentMonth = toYearMonth(new Date());

  const fixedExpenses = commitments.filter((c) => c.type === "expense" && (c.expenseType ?? "fixed") === "fixed");
  const variableExpenses = commitments.filter((c) => c.type === "expense" && c.expenseType === "variable" && c.month === selectedMonth);
  const fixedIncomes = commitments.filter((c) => c.type === "income" && (c.incomeType ?? "fixed") === "fixed");
  const variableIncomes = commitments.filter((c) => c.type === "income" && c.incomeType === "variable");
  const variableTotal = variableExpenses.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Compromisos</h1>
            <PageInfoTooltip text="Acá registras los pagos e ingresos recurrentes (arriendo, servicios, salario, préstamos) y también los gastos puntuales de cada mes como salidas, compras ocasionales o cualquier gasto que no se repita cada mes." />
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Gastos fijos, ingresos y gastos variables del mes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo compromiso
        </button>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editing ? "Editar" : "Nuevo"}{" "}
              {isVariableExpenseForm ? "gasto variable" : "compromiso"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo: gasto / ingreso */}
              <div className="flex gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, category: "", expenseType: "fixed" })}
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

              {/* Para gastos: ¿fijo o puntual? */}
              {form.type === "expense" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Este gasto se repite cada mes?
                  </label>
                  <div className="flex gap-2">
                    {(["fixed", "variable"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, expenseType: t, payDay: "", totalInstallments: "" })}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                          form.expenseType === t
                            ? t === "fixed"
                              ? "bg-red-100 text-red-600 ring-1 ring-red-300"
                              : "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t === "fixed" ? "Sí, es fijo" : "No, es puntual"}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.expenseType === "variable"
                      ? `Se registra solo para ${monthLabel(selectedMonth)} y no aparece el mes siguiente.`
                      : "Aparece todos los meses como un compromiso recurrente."}
                  </p>
                </div>
              )}

              {/* Para ingresos: ¿fijo o variable? */}
              {form.type === "income" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Cómo recibes este ingreso?
                  </label>
                  <div className="flex gap-2">
                    {(["fixed", "variable"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, incomeType: t, payDay: "" })}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                          form.incomeType === t
                            ? "bg-green-100 text-green-700 ring-1 ring-green-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t === "fixed" ? "Fijo" : "Variable"}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.incomeType === "variable"
                      ? "Monto distinto cada vez: ventas, comisiones, domicilios, etc."
                      : "Mismo monto en fecha definida: salario, arriendo cobrado, etc."}
                  </p>
                </div>
              )}

              {form.type === "income" && form.incomeType === "fixed" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ¿Cada cuánto te pagan?
                  </label>
                  <div className="flex gap-2">
                    {(["monthly", "biweekly"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setForm({ ...form, frequency: f })}
                        className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                          form.frequency === f
                            ? "bg-green-100 text-green-700 ring-1 ring-green-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {f === "monthly" ? "Mensual" : "Quincenal"}
                      </button>
                    ))}
                  </div>
                  {form.frequency === "biweekly" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Recibirás dos pagos al mes separados 15 días.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder={
                    isVariableExpenseForm
                      ? "Ej: Restaurante, Salida al cine, Ropa"
                      : form.type === "income"
                      ? form.incomeType === "variable"
                        ? "Ej: Ventas del mes"
                        : "Ej: Salario mensual"
                      : "Ej: Arriendo apartamento"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.type === "income" && form.incomeType === "variable"
                    ? "Meta mensual estimada"
                    : form.type === "income" && form.frequency === "biweekly"
                    ? "Monto por quincena"
                    : "Monto"}
                </label>
                <MoneyInput
                  required
                  value={form.amount}
                  onChange={(v) => setForm({ ...form, amount: v })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
                {form.type === "income" && form.incomeType === "variable" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Cuánto esperas recibir en el mes. Registra cada pago desde El resumen.
                  </p>
                )}
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
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opciones adicionales: solo para gastos fijos e ingresos */}
              {!isVariableExpenseForm && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Opciones adicionales
                  </p>

                  {!(form.type === "income" && form.incomeType === "variable") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {form.type === "income" && form.frequency === "biweekly" ? (
                          <>Día del primer pago <span className="text-gray-400 font-normal">(opcional, 1–15)</span></>
                        ) : (
                          <>Día de pago mensual <span className="text-gray-400 font-normal">(opcional, 1–31)</span></>
                        )}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={form.type === "income" && form.frequency === "biweekly" ? "15" : "31"}
                        value={form.payDay}
                        onChange={(e) => setForm({ ...form, payDay: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder={form.type === "income" && form.frequency === "biweekly" ? "Ej: 1" : "Ej: 10"}
                      />
                      {form.payDay && form.type === "income" && form.frequency === "biweekly" ? (
                        <p className="text-xs text-blue-600 mt-1">
                          Primera quincena: día {form.payDay} · Segunda quincena: día {Math.min(parseInt(form.payDay) + 15, 31)}
                        </p>
                      ) : form.payDay ? (
                        <p className="text-xs text-blue-600 mt-1">
                          Te recordaremos este pago el día {form.payDay} de cada mes.
                        </p>
                      ) : null}
                    </div>
                  )}

                  {form.type === "expense" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total de cuotas{" "}
                        <span className="text-gray-400 font-normal">(opcional, solo para préstamos)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={form.totalInstallments}
                        onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Ej: 12 (para un préstamo a 12 cuotas)"
                      />
                      {form.totalInstallments && (
                        <p className="text-xs text-purple-600 mt-1">
                          La app contará las cuotas que pagues y te avisará cuándo termines.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                  {submitting ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteCommitment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Eliminar</h2>
              <button onClick={() => setDeleteCommitment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1">¿Seguro que quieres eliminar esto?</p>
            <p className="text-sm font-medium text-gray-700 mb-6">&quot;{deleteCommitment.name}&quot;</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCommitment(null)}
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

      {/* Gastos fijos */}
      <CommitmentSection
        title="Gastos fijos"
        items={fixedExpenses}
        type="expense"
        emptyMessage="No tienes gastos fijos configurados. Agrega tus compromisos mensuales como arriendo, servicios, préstamos, etc."
        onEdit={openEdit}
        onDelete={setDeleteCommitment}
        onToggle={toggleActive}
      />

      {/* Gastos variables del mes */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Gastos variables del mes</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Gastos puntuales que <span className="font-medium">no se repiten</span>: restaurantes, salidas, compras ocasionales, etc. Solo aparecen en el mes que los registras.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {variableTotal > 0 && (
              <span className="text-sm font-semibold text-red-500">Total: {fmt(variableTotal)}</span>
            )}
            <button
              onClick={openCreateVariable}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        {/* Navegación de mes */}
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-800">{monthLabel(selectedMonth)}</span>
            {selectedMonth === currentMonth && (
              <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                mes actual
              </span>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {variableExpenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm px-6">
            Sin gastos variables en {monthLabel(selectedMonth)}.{" "}
            {selectedMonth === currentMonth && (
              <span>
                Usa el botón <span className="text-amber-600 font-medium">Agregar</span> para registrar un gasto puntual del mes.
              </span>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Nombre", "Categoría", "Monto", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {variableExpenses.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <span className="text-xs text-amber-600 font-medium">Gasto puntual</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-red-500">{fmt(c.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCommitment(c)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
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

      {/* Ingresos fijos */}
      <CommitmentSection
        title="Ingresos fijos"
        items={fixedIncomes}
        type="income"
        emptyMessage="No tienes ingresos fijos. Agrega tu salario u otros ingresos de monto constante."
        onEdit={openEdit}
        onDelete={setDeleteCommitment}
        onToggle={toggleActive}
      />

      {/* Ingresos variables */}
      <CommitmentSection
        title="Ingresos variables"
        items={variableIncomes}
        type="income"
        emptyMessage="No tienes ingresos variables. Agrega ventas, comisiones u otros ingresos de monto distinto cada vez."
        onEdit={openEdit}
        onDelete={setDeleteCommitment}
        onToggle={toggleActive}
        showVariableBadge
      />
    </div>
  );
}

function CommitmentSection({
  title,
  items,
  type,
  emptyMessage,
  onEdit,
  onDelete,
  onToggle,
  showVariableBadge = false,
}: {
  title: string;
  items: Commitment[];
  type: "income" | "expense";
  emptyMessage: string;
  onEdit: (c: Commitment) => void;
  onDelete: (c: Commitment) => void;
  onToggle: (c: Commitment) => void;
  showVariableBadge?: boolean;
}) {
  const { fmt } = useSettings();
  const activeTotal = items
    .filter((c) => c.isActive)
    .reduce((s, c) => s + (c.frequency === "biweekly" ? c.amount * 2 : c.amount), 0);
  const amountHeader = showVariableBadge ? "Meta mensual" : "Monto mensual";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {activeTotal > 0 && (
          <span className={`text-sm font-semibold ${type === "income" ? "text-green-600" : "text-red-500"}`}>
            {showVariableBadge ? "Meta total activa:" : "Total activo:"} {fmt(activeTotal)}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm px-6">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Nombre", "Categoría", amountHeader, "Activo", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((c) => (
                <tr
                  key={c._id}
                  className={`hover:bg-gray-50 transition-colors ${!c.isActive ? "opacity-50" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {showVariableBadge && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Variable · Registra pagos desde El resumen
                        </span>
                      )}
                      {c.frequency === "biweekly" && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Quincenal
                        </span>
                      )}
                      {c.payDay && c.frequency === "biweekly" ? (
                        <span className="text-xs text-blue-500">
                          Días {c.payDay} y {Math.min(c.payDay + 15, 31)} de cada mes
                        </span>
                      ) : c.payDay ? (
                        <span className="text-xs text-blue-500">Día {c.payDay} de cada mes</span>
                      ) : null}
                      {c.totalInstallments && (
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            (c.installmentsPaid ?? 0) >= c.totalInstallments
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {(c.installmentsPaid ?? 0) >= c.totalInstallments
                            ? "¡Préstamo completado!"
                            : `Faltan ${c.totalInstallments - (c.installmentsPaid ?? 0)} cuota(s) de ${c.totalInstallments}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {c.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className={`text-sm font-semibold ${type === "income" ? "text-green-600" : "text-red-500"}`}>
                        {fmt(c.frequency === "biweekly" ? c.amount * 2 : c.amount)}
                      </span>
                      {c.frequency === "biweekly" && (
                        <p className="text-xs text-gray-400">{fmt(c.amount)}/quincena</p>
                      )}
                      {showVariableBadge && <p className="text-xs text-gray-400">estimado</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => onToggle(c)}
                      title={c.isActive ? "Clic para desactivar" : "Clic para activar"}
                      className="flex items-center gap-2 group"
                    >
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                          c.isActive ? "bg-green-500" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                            c.isActive ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${c.isActive ? "text-green-600" : "text-gray-400"}`}>
                        {c.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(c)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
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
  );
}
