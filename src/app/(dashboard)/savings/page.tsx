"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Target, Trash2, TrendingUp, AlertTriangle, Pencil, X } from "lucide-react";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";
import { MoneyInput } from "@/components/ui/MoneyInput";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

interface SavingsPlan {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  category: string;
  description?: string;
  isActive: boolean;
}

const CATEGORIES = ["Emergencia", "Vacaciones", "Educación", "Retiro", "Vivienda", "Vehículo", "Otro"];

const EMPTY_FORM = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  monthlyContribution: "",
  category: "Emergencia",
  description: "",
};

export default function SavingsPage() {
  const { fmt } = useSettings();
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = sessionStorage.getItem("platica_savings_alerts");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SavingsPlan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal de aporte
  const [contributionPlan, setContributionPlan] = useState<SavingsPlan | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionSubmitting, setContributionSubmitting] = useState(false);

  // Modal de confirmación de eliminación
  const [deletePlan, setDeletePlan] = useState<SavingsPlan | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/savings");
    const data = await res.json();
    setPlans(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  function openCreate() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(plan: SavingsPlan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      targetAmount: String(plan.targetAmount),
      currentAmount: String(plan.currentAmount),
      targetDate: plan.targetDate.slice(0, 10),
      monthlyContribution: String(plan.monthlyContribution),
      category: plan.category,
      description: plan.description ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPlan(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (editingPlan) {
      await fetch(`/api/savings/${editingPlan._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    closeForm();
    setSubmitting(false);
    fetchPlans();
  }

  async function confirmDelete() {
    if (!deletePlan) return;
    setDeleteSubmitting(true);
    await fetch(`/api/savings/${deletePlan._id}`, { method: "DELETE" });
    setDeletePlan(null);
    setDeleteSubmitting(false);
    fetchPlans();
  }

  async function submitContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!contributionPlan) return;
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) return;
    setContributionSubmitting(true);

    await Promise.all([
      fetch(`/api/savings/${contributionPlan._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: contributionPlan.currentAmount + amount }),
      }),
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "expense",
          amount,
          category: "Ahorro",
          description: `Aporte a "${contributionPlan.name}"`,
          date: new Date().toISOString().slice(0, 10),
          tags: ["ahorro"],
        }),
      }),
    ]);

    setContributionPlan(null);
    setContributionAmount("");
    setContributionSubmitting(false);
    fetchPlans();
  }

  const totalTarget = plans.reduce((s, p) => s + p.targetAmount, 0);
  const totalSaved = plans.reduce((s, p) => s + p.currentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Planes de ahorro</h1>
            <PageInfoTooltip text="Crea metas de ahorro con un monto objetivo y una fecha límite. Cada vez que reserves dinero, registra el aporte en el plan correspondiente y observa tu progreso. Los aportes también mejoran tu tasa de ahorro en Consejos financieros." />
          </div>
          <p className="text-gray-500 text-sm mt-1">{plans.length} planes activos</p>
        </div>
        <button
          onClick={openCreate}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo plan
        </button>
      </div>

      {/* Resumen */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Meta total</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(totalTarget)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total ahorrado</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totalSaved)}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Progreso general</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Modal crear / editar plan */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPlan ? "Editar plan de ahorro" : "Nuevo plan de ahorro"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del plan</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ej: Fondo de emergencia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta de ahorro</label>
                <MoneyInput
                  required
                  value={form.targetAmount}
                  onChange={(v) => setForm({ ...form, targetAmount: v })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad ya ahorrada</label>
                <MoneyInput
                  value={form.currentAmount}
                  onChange={(v) => setForm({ ...form, currentAmount: v })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribución mensual</label>
                <MoneyInput
                  required
                  value={form.monthlyContribution}
                  onChange={(v) => setForm({ ...form, monthlyContribution: v })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha objetivo</label>
                <input
                  type="date"
                  required
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                  placeholder="Para qué es este ahorro..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingPlan ? "Guardar cambios" : "Crear plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal registrar aporte */}
      {contributionPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Registrar aporte</h2>
              <button
                onClick={() => { setContributionPlan(null); setContributionAmount(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Plan: <span className="font-medium text-gray-700">{contributionPlan.name}</span>
            </p>
            <form onSubmit={submitContribution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a agregar</label>
                <MoneyInput
                  required
                  autoFocus
                  value={contributionAmount}
                  onChange={(v) => setContributionAmount(v)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setContributionPlan(null); setContributionAmount(""); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contributionSubmitting}
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {contributionSubmitting ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deletePlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Eliminar plan</h2>
            <p className="text-sm text-gray-500 mb-6">
              ¿Seguro que quieres eliminar{" "}
              <span className="font-medium text-gray-700">&quot;{deletePlan.name}&quot;</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePlan(null)}
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

      {/* Grilla de planes */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando planes...</div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aún no tienes planes de ahorro</p>
          <p className="text-gray-400 text-sm mt-1">Crea tu primer plan para empezar a ahorrar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const progress = Math.min(100, (plan.currentAmount / plan.targetAmount) * 100);
            const remaining = Math.max(0, plan.targetAmount - plan.currentAmount);
            const monthsLeft = plan.monthlyContribution > 0
              ? Math.ceil(remaining / plan.monthlyContribution)
              : null;

            const now = new Date();
            const target = new Date(plan.targetDate);
            const monthsAvailable = Math.max(0,
              (target.getFullYear() - now.getFullYear()) * 12 +
              (target.getMonth() - now.getMonth())
            );
            const idealMonthly = monthsAvailable > 0 ? Math.ceil(remaining / monthsAvailable) : null;
            const isOffTrack = remaining > 0 && monthsAvailable > 0 && monthsLeft !== null && monthsLeft > monthsAvailable;

            return (
              <div key={plan._id} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{plan.category}</span>
                    <h3 className="font-semibold text-gray-900 mt-2 truncate">{plan.name}</h3>
                    {plan.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{plan.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(plan)}
                      className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                      title="Editar plan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletePlan(plan)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      title="Eliminar plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Progreso</span>
                    <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{fmt(plan.currentAmount)}</span>
                    <span>{fmt(plan.targetAmount)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>Faltan</span>
                    <span className="font-medium text-gray-700">{fmt(remaining)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aporte mensual</span>
                    <span className="font-medium text-gray-700">{fmt(plan.monthlyContribution)}</span>
                  </div>
                  {monthsLeft !== null && (
                    <div className="flex justify-between">
                      <span>Estimado para alcanzar</span>
                      <span className="font-medium text-gray-700">{monthsLeft} meses</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Fecha objetivo</span>
                    <span className="font-medium text-gray-700">{formatDate(plan.targetDate)}</span>
                  </div>
                </div>

                {isOffTrack && idealMonthly && !dismissedAlerts.has(plan._id) && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 space-y-1 flex-1">
                        <p>
                          Con tu aporte actual llegarás a la meta en{" "}
                          <strong>{monthsLeft} meses</strong>, pero tu fecha objetivo
                          es en <strong>{monthsAvailable} meses</strong>.
                        </p>
                        <p>
                          Para llegar a tiempo necesitas ahorrar{" "}
                          <strong>{fmt(idealMonthly)}/mes</strong>.
                        </p>
                        <Link
                          href="/insights"
                          className="inline-block mt-1 text-amber-700 font-semibold hover:underline"
                        >
                          Ver consejos de ahorro →
                        </Link>
                      </div>
                      <button
                        onClick={() => {
                          const next = new Set([...dismissedAlerts, plan._id]);
                          setDismissedAlerts(next);
                          sessionStorage.setItem("platica_savings_alerts", JSON.stringify([...next]));
                        }}
                        className="text-amber-400 hover:text-amber-700 transition-colors shrink-0"
                        aria-label="Cerrar alerta"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setContributionPlan(plan); setContributionAmount(""); }}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  Registrar aporte
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
