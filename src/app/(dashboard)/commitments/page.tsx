"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { CATEGORIES } from "@/lib/categories";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";

interface Commitment {
  _id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  isActive: boolean;
  payDay?: number;
  totalInstallments?: number;
  installmentsPaid?: number;
}

const EMPTY_FORM = {
  name: "",
  amount: "",
  type: "expense" as "income" | "expense",
  category: "",
  payDay: "",
  totalInstallments: "",
};

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Commitment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteCommitment, setDeleteCommitment] = useState<Commitment | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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

  function openEdit(c: Commitment) {
    setEditing(c);
    setForm({
      name: c.name,
      amount: String(c.amount),
      type: c.type,
      category: c.category,
      payDay: c.payDay ? String(c.payDay) : "",
      totalInstallments: c.totalInstallments ? String(c.totalInstallments) : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const body = {
      name: form.name,
      amount: parseFloat(form.amount),
      type: form.type,
      category: form.category,
      payDay: form.payDay ? parseInt(form.payDay) : undefined,
      totalInstallments: form.totalInstallments ? parseInt(form.totalInstallments) : undefined,
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

  const { fmt } = useSettings();
  const categories = CATEGORIES[form.type];
  const expenses = commitments.filter((c) => c.type === "expense");
  const incomes = commitments.filter((c) => c.type === "income");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Compromisos fijos</h1>
            <PageInfoTooltip text="Acá registras los pagos e ingresos que se repiten cada mes: arriendo, servicios, salario, préstamos. Puedes activarlos o desactivarlos, asignarles un día de pago para recibir recordatorios, y llevar el conteo de cuotas de préstamos." />
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Gastos e ingresos recurrentes que tienes cada mes
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editing ? "Editar compromiso" : "Nuevo compromiso"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, category: "" })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder={
                    form.type === "income" ? "Ej: Salario mensual" : "Ej: Arriendo apartamento"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto esperado
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0.00"
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
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campos opcionales */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Opciones adicionales</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Día de pago mensual <span className="text-gray-400 font-normal">(opcional, 1–31)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.payDay}
                    onChange={(e) => setForm({ ...form, payDay: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Ej: 10 (para el día 10 de cada mes)"
                  />
                  {form.payDay && (
                    <p className="text-xs text-blue-600 mt-1">
                      Te recordaremos este pago el día {form.payDay} de cada mes.
                    </p>
                  )}
                </div>

                {form.type === "expense" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total de cuotas <span className="text-gray-400 font-normal">(opcional, solo para préstamos)</span>
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
              <h2 className="text-lg font-semibold text-gray-900">Eliminar compromiso</h2>
              <button onClick={() => setDeleteCommitment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-1">¿Seguro que quieres eliminar este compromiso?</p>
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

      <CommitmentSection
        title="Gastos fijos"
        items={expenses}
        type="expense"
        emptyMessage="No tienes gastos fijos configurados. Agrega tus compromisos mensuales como arriendo, servicios, préstamos, etc."
        onEdit={openEdit}
        onDelete={setDeleteCommitment}
        onToggle={toggleActive}
      />

      <CommitmentSection
        title="Ingresos fijos"
        items={incomes}
        type="income"
        emptyMessage="No tienes ingresos fijos configurados. Agrega tu salario u otros ingresos recurrentes."
        onEdit={openEdit}
        onDelete={setDeleteCommitment}
        onToggle={toggleActive}
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
}: {
  title: string;
  items: Commitment[];
  type: "income" | "expense";
  emptyMessage: string;
  onEdit: (c: Commitment) => void;
  onDelete: (c: Commitment) => void;
  onToggle: (c: Commitment) => void;
}) {
  const { fmt } = useSettings();
  const activeTotal = items.filter((c) => c.isActive).reduce((s, c) => s + c.amount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {activeTotal > 0 && (
          <span
            className={`text-sm font-semibold ${
              type === "income" ? "text-green-600" : "text-red-500"
            }`}
          >
            Total activo: {fmt(activeTotal)}
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
              {["Nombre", "Categoría", "Monto esperado", "Activo", ""].map((h) => (
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
                    {c.payDay && (
                      <span className="text-xs text-blue-500">Día {c.payDay} de cada mes</span>
                    )}
                    {c.totalInstallments && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        (c.installmentsPaid ?? 0) >= c.totalInstallments
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
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
                  <span
                    className={`text-sm font-semibold ${
                      type === "income" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {fmt(c.amount)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => onToggle(c)}
                    title={c.isActive ? "Clic para desactivar" : "Clic para activar"}
                    className="flex items-center gap-2 group"
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${c.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${c.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
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
