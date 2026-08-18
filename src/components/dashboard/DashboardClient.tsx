"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Repeat2,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Clock,
  Plus,
  Wallet,
  X,
  Info,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Bell,
  AlertCircle,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

const CATEGORIES = {
  income: ["Salario", "Freelance", "Inversiones", "Ventas", "Otros ingresos"],
  expense: [
    "Alimentación", "Mercado", "Transporte", "Pasajes", "Vivienda",
    "Salud", "Educación", "Entretenimiento", "Paseos", "Ropa",
    "Servicios", "Gastos hormiga", "Deudas", "Otros gastos",
  ],
};

const EMPTY_FORM = {
  type: "expense" as "income" | "expense",
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  commitmentId: "",
};

interface CommitmentOption {
  _id: string;
  name: string;
  type: "income" | "expense";
  isActive: boolean;
}

interface CommitmentItem {
  _id: string;
  name: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  paid: boolean;
  paidAmount: number;
  payDay?: number;
  totalInstallments?: number;
  installmentsPaid?: number;
}

interface DashboardData {
  monthlySummaries: { month: string; income: number; expense: number; balance: number }[];
  categoryBreakdown: { name: string; value: number }[];
  prevCategoryBreakdown: { name: string; value: number }[];
  recentTransactions: {
    _id: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }[];
  savingsPlans: {
    _id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    monthlyContribution: number;
  }[];
  currentMonth: { month: string; income: number; expense: number; balance: number };
  commitments: CommitmentItem[];
  incomeByCategory: { category: string; total: number }[];
}

// ─── Tooltip informativo ────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        className="p-1 text-gray-300 hover:text-gray-500 transition-colors rounded"
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>
      {visible && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// ─── Onboarding checklist ───────────────────────────────────────────────────

function OnboardingChecklist({
  hasCommitments,
  hasIncome,
  hasExpense,
  onNewTransaction,
}: {
  hasCommitments: boolean;
  hasIncome: boolean;
  hasExpense: boolean;
  onNewTransaction: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem("platica_onboarding_dismissed") === "true");
  }, []);

  const steps = [
    { done: true, label: "Creaste tu cuenta", action: null },
    {
      done: hasCommitments,
      label: "Configura tus compromisos fijos",
      description: "Arriendo, servicios, préstamos, salario...",
      action: <Link href="/commitments" className="text-xs text-green-600 font-medium hover:underline">Ir a Compromisos →</Link>,
    },
    {
      done: hasIncome,
      label: "Registra tu primer ingreso",
      description: "Tu salario, un pago extra, lo que sea.",
      action: (
        <button onClick={onNewTransaction} className="text-xs text-green-600 font-medium hover:underline">
          Nueva transacción →
        </button>
      ),
    },
    {
      done: hasExpense,
      label: "Registra tu primer gasto",
      description: "Mercado, transporte, cualquier egreso.",
      action: (
        <button onClick={onNewTransaction} className="text-xs text-green-600 font-medium hover:underline">
          Nueva transacción →
        </button>
      ),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  useEffect(() => {
    if (allDone && !dismissed) {
      localStorage.setItem("platica_onboarding_dismissed", "true");
      setDismissed(true);
    }
  }, [allDone, dismissed]);

  function dismiss() {
    localStorage.setItem("platica_onboarding_dismissed", "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className={`bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl overflow-hidden transition-all`}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
            <CheckCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">
              {allDone ? "¡Todo listo! 🎉" : "Primeros pasos en platíca"}
            </p>
            <p className="text-xs text-green-700">
              {completedCount} de {steps.length} completados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allDone && (
            <button onClick={dismiss} className="text-xs text-green-600 font-medium hover:text-green-800">
              Ocultar
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-green-500 hover:text-green-700"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {!allDone && (
            <button onClick={dismiss} className="text-green-400 hover:text-green-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="px-5 pb-1">
        <div className="w-full bg-green-200 rounded-full h-1.5">
          <div
            className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {!collapsed && (
        <div className="px-5 py-4 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? "bg-green-500" : "bg-white border-2 border-green-300"}`}>
                {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "text-green-700 line-through opacity-60" : "text-green-900"}`}>
                  {step.label}
                </p>
                {!step.done && step.description && (
                  <p className="text-xs text-green-600 mt-0.5">{step.description}</p>
                )}
                {!step.done && step.action && <div className="mt-1">{step.action}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────

export default function DashboardClient({
  data,
  userName,
}: {
  data: DashboardData;
  userName: string;
}) {
  const {
    monthlySummaries,
    categoryBreakdown,
    prevCategoryBreakdown,
    recentTransactions,
    savingsPlans,
    currentMonth,
    commitments,
    incomeByCategory,
  } = data;

  const { fmt } = useSettings();
  const router = useRouter();
  const [tip, setTip] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [commitmentOptions, setCommitmentOptions] = useState<CommitmentOption[]>([]);

  useEffect(() => {
    fetch("/api/commitments")
      .then((r) => r.json())
      .then((d) => setCommitmentOptions(Array.isArray(d) ? d.filter((c: CommitmentOption) => c.isActive) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("platica_tip_dismissed")) return;
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        if (d.alerts?.[0]) setTip(d.alerts[0].tip);
        else if (d.hormigaAlert) setTip(d.hormigaAlert.tip);
        else if (d.savingsTips?.[0]) setTip(d.savingsTips[0]);
      })
      .catch(() => {});
  }, []);

  function openModal() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  const [payingId, setPayingId] = useState<string | null>(null);

  async function payCommitment(c: CommitmentItem) {
    setPayingId(c._id);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: c.type,
        amount: c.amount,
        category: c.category,
        description: c.name,
        date: new Date().toISOString().slice(0, 10),
        commitmentId: c._id,
      }),
    });

    if (c.totalInstallments) {
      const newPaid = (c.installmentsPaid ?? 0) + 1;
      const updateBody: Record<string, unknown> = { installmentsPaid: newPaid };
      if (newPaid >= c.totalInstallments) updateBody.isActive = false;
      await fetch(`/api/commitments/${c._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody),
      });
    }

    setPayingId(null);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        commitmentId: form.commitmentId || undefined,
      }),
    });
    setSubmitting(false);
    setShowModal(false);
    router.refresh();
  }

  const expenseCommitments = commitments.filter((c) => c.type === "expense");
  const incomeCommitments = commitments.filter((c) => c.type === "income");
  const totalExpenseCommitments = expenseCommitments.reduce((s, c) => s + c.amount, 0);
  const paidCount = expenseCommitments.filter((c) => c.paid).length;
  const libreEstimado = currentMonth.income - totalExpenseCommitments;

  const spentPercent =
    currentMonth.income > 0
      ? Math.round((currentMonth.expense / currentMonth.income) * 100)
      : currentMonth.expense > 0 ? 100 : 0;

  const savingsRate =
    currentMonth.income > 0
      ? Math.max(0, ((currentMonth.income - currentMonth.expense) / currentMonth.income) * 100)
      : 0;

  const monthLabel = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(new Date());
  const currentMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const barColor = spentPercent > 90 ? "bg-red-500" : spentPercent > 70 ? "bg-amber-400" : "bg-green-500";
  const hasData = currentMonth.income > 0 || currentMonth.expense > 0;
  const hasIncome = monthlySummaries.some((m) => m.income > 0);
  const hasExpense = monthlySummaries.some((m) => m.expense > 0);

  // ── Recordatorios de próximos pagos ────────────────────────────────────────
  const todayDay = new Date().getDate();
  const upcomingPayments = commitments
    .filter((c) => c.type === "expense" && !c.paid && c.payDay != null)
    .filter((c) => {
      const diff = c.payDay! - todayDay;
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => (a.payDay ?? 0) - (b.payDay ?? 0));
  const overduePayments = commitments
    .filter((c) => c.type === "expense" && !c.paid && c.payDay != null && c.payDay < todayDay);

  // ── Insights comparativos ──────────────────────────────────────────────────
  interface Insight { positive: boolean; message: string }
  const insights: Insight[] = [];

  if (monthlySummaries.length >= 2) {
    const prev = monthlySummaries[monthlySummaries.length - 2];
    const curr = monthlySummaries[monthlySummaries.length - 1];
    if (prev.expense > 0 && curr.expense > 0) {
      const diffPct = Math.round(((curr.expense - prev.expense) / prev.expense) * 100);
      if (Math.abs(diffPct) >= 5) {
        if (diffPct < 0) {
          insights.push({ positive: true, message: `¡Este mes llevas un ${Math.abs(diffPct)}% menos de gasto que el mes pasado! Sigue así.` });
        } else {
          insights.push({ positive: false, message: `Este mes llevas un ${diffPct}% más de gasto que el mes pasado. Revisa en qué categorías subió.` });
        }
      }
    }
  }

  categoryBreakdown.forEach((curr) => {
    const prev = prevCategoryBreakdown.find((p) => p.name === curr.name);
    if (!prev || prev.value === 0) return;
    const diffPct = Math.round(((curr.value - prev.value) / prev.value) * 100);
    if (Math.abs(diffPct) < 10) return;
    if (diffPct > 0) {
      insights.push({ positive: false, message: `Gastaste ${diffPct}% más en ${curr.name} que el mes pasado (${fmt(curr.value)} vs ${fmt(prev.value)}).` });
    } else {
      insights.push({ positive: true, message: `¡Bajaste el gasto en ${curr.name} un ${Math.abs(diffPct)}% respecto al mes pasado! (${fmt(curr.value)} vs ${fmt(prev.value)}).` });
    }
  });

  savingsPlans.forEach((plan) => {
    if (plan.monthlyContribution > 0) {
      const progress = Math.min(100, (plan.currentAmount / plan.targetAmount) * 100);
      insights.push({ positive: true, message: `Recuerda aportar ${fmt(plan.monthlyContribution)}/mes a tu meta "${plan.name}" (${progress.toFixed(0)}% completada).` });
    }
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {userName.split(" ")[0]}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{currentMonthLabel}</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva transacción
        </button>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist
        hasCommitments={commitments.length > 0}
        hasIncome={hasIncome}
        hasExpense={hasExpense}
        onNewTransaction={openModal}
      />

      {/* Consejo rápido */}
      {tip && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 flex-1">{tip}</p>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/insights" className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => { setTip(null); sessionStorage.setItem("platica_tip_dismissed", "true"); }}
              className="text-amber-400 hover:text-amber-700 transition-colors"
              aria-label="Cerrar consejo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Recordatorios de pago */}
      {(upcomingPayments.length > 0 || overduePayments.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">Recordatorios de pago</h3>
          </div>
          {overduePayments.map((c) => (
            <div key={c._id} className="flex items-center justify-between text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-red-800">Debías pagar <span className="font-semibold">{c.name}</span> el día {c.payDay} — ¿ya lo pagaste?</span>
              </div>
              <span className="text-red-600 font-semibold shrink-0 ml-3">{fmt(c.amount)}</span>
            </div>
          ))}
          {upcomingPayments.map((c) => {
            const diff = c.payDay! - todayDay;
            const label = diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : `El día ${c.payDay}`;
            return (
              <div key={c._id} className="flex items-center justify-between text-sm bg-white border border-blue-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-blue-800">
                    <span className="font-semibold">{label}</span> debes pagar <span className="font-semibold">{c.name}</span>
                    {c.totalInstallments && (
                      <span className="text-blue-500 ml-1 text-xs">(cuota {(c.installmentsPaid ?? 0) + 1} de {c.totalInstallments})</span>
                    )}
                  </span>
                </div>
                <span className="text-blue-700 font-semibold shrink-0 ml-3">{fmt(c.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* HERO — Balance del mes */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-gray-400">Balance del mes</p>
              <InfoTooltip text="Diferencia entre tus ingresos y gastos de este mes. En verde si ganas más de lo que gastas, en rojo si hay déficit." />
            </div>
            <p className={`text-5xl font-bold tracking-tight ${currentMonth.balance >= 0 ? "text-gray-900" : "text-red-500"}`}>
              {fmt(currentMonth.balance)}
            </p>
          </div>
          {hasData && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentMonth.balance >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {currentMonth.balance >= 0 ? "Positivo" : "Déficit"}
            </span>
          )}
        </div>

        {hasData ? (
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5 text-green-600">
                <TrendingUp className="w-4 h-4" /> {fmt(currentMonth.income)}
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <TrendingDown className="w-4 h-4" /> {fmt(currentMonth.expense)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, spentPercent)}%` }} />
            </div>
            <p className="text-xs text-gray-400">
              {spentPercent <= 100
                ? `Llevas gastado el ${spentPercent}% de tus ingresos este mes`
                : `Tus gastos superaron los ingresos en ${fmt(currentMonth.expense - currentMonth.income)}`}
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">
              Aún no hay movimientos este mes.{" "}
              <button onClick={openModal} className="text-green-600 font-medium hover:underline">
                Registra tu primera transacción →
              </button>
            </p>
          </div>
        )}
      </div>

      {/* 2 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Compromisos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Repeat2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">Compromisos del mes</span>
              <InfoTooltip text="Cuántos de tus gastos fijos del mes ya están cubiertos. Usa el botón 'Pagado' en el panel de compromisos para marcarlo." />
            </div>
          </div>
          {expenseCommitments.length === 0 ? (
            <Link href="/commitments" className="text-sm text-purple-600 font-medium hover:text-purple-700">
              Configurar compromisos →
            </Link>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">
                {paidCount}<span className="text-gray-400 font-normal text-xl"> / {expenseCommitments.length}</span>
              </p>
              <p className="text-xs text-gray-400">cubiertos este mes</p>
              <Link href="/commitments" className="mt-1 text-xs text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1 w-fit">
                Ver detalle <ArrowRight className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>

        {/* Libre estimado */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${libreEstimado >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">Libre estimado</span>
              <InfoTooltip text="Tus ingresos del mes menos el total de tus compromisos fijos. Es el dinero disponible para gastos variables y ahorro." />
            </div>
          </div>
          <p className={`text-3xl font-bold ${libreEstimado >= 0 ? "text-gray-900" : "text-red-500"}`}>
            {fmt(libreEstimado)}
          </p>
          <p className="text-xs text-gray-400">
            {totalExpenseCommitments > 0
              ? `Ingresos − compromisos (${fmt(totalExpenseCommitments)})`
              : "Configura compromisos para ver este cálculo"}
          </p>
        </div>
      </div>

      {/* Compromisos del mes + Ingresos por fuente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Compromisos */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Compromisos del mes</h2>
              <InfoTooltip text="Tus obligaciones fijas mensuales. Haz clic en 'Pagado' para registrar el pago y marcarlo como cubierto automáticamente." />
            </div>
            <Link href="/commitments" className="text-xs text-green-700 font-medium hover:text-green-900 flex items-center gap-1">
              Gestionar <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {commitments.length === 0 ? (
            <div className="text-center py-8">
              <Repeat2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">No tienes compromisos configurados</p>
              <Link href="/commitments" className="text-sm text-green-600 font-medium hover:text-green-700">
                Agregar compromisos →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {expenseCommitments.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Gastos</p>
                  {expenseCommitments.map((c) => (
                    <div key={c._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.paid
                          ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          : <Clock className="w-5 h-5 text-amber-400 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">
                            {c.category}
                            {c.totalInstallments && (
                              <span className="ml-2 text-purple-500">
                                · {c.totalInstallments - (c.installmentsPaid ?? 0) === 0
                                  ? "¡Completado!"
                                  : `Faltan ${c.totalInstallments - (c.installmentsPaid ?? 0)} cuota(s)`}
                              </span>
                            )}
                            {c.payDay && !c.totalInstallments && (
                              <span className="ml-2 text-blue-400">· Día {c.payDay}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${c.paid ? "text-green-600" : "text-gray-600"}`}>
                            {fmt(c.amount)}
                          </p>
                          <p className={`text-xs ${c.paid ? "text-green-500" : "text-amber-500"}`}>
                            {c.paid ? "Cubierto" : "Pendiente"}
                          </p>
                        </div>
                        {!c.paid && (
                          <button
                            onClick={() => payCommitment(c)}
                            disabled={payingId === c._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {payingId === c._id ? "..." : "Pagado"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {incomeCommitments.length > 0 && (
                <div className={expenseCommitments.length > 0 ? "pt-4" : ""}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ingresos esperados</p>
                  {incomeCommitments.map((c) => (
                    <div key={c._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        {c.paid
                          ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          : <Clock className="w-5 h-5 text-amber-400 shrink-0" />}
                        <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-green-600">{fmt(c.amount)}</p>
                        {!c.paid && (
                          <button
                            onClick={() => payCommitment(c)}
                            disabled={payingId === c._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {payingId === c._id ? "..." : "Recibido"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {expenseCommitments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Comprometido</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{fmt(totalExpenseCommitments)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Cubierto</p>
                    <p className="text-sm font-bold text-green-600 mt-0.5">
                      {fmt(expenseCommitments.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Libre estimado</p>
                    <p className={`text-sm font-bold mt-0.5 ${libreEstimado >= 0 ? "text-blue-600" : "text-red-500"}`}>
                      {fmt(libreEstimado)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ingresos por fuente */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="font-semibold text-gray-900">Ingresos por fuente</h2>
            <InfoTooltip text="Desglose de tus ingresos del mes actual agrupados por categoría. Te ayuda a ver de dónde viene tu dinero." />
          </div>
          {incomeByCategory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <TrendingUp className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400 mb-3">Sin ingresos este mes</p>
              <button onClick={openModal} className="text-xs text-green-600 font-medium hover:underline">
                Registrar ingreso →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {incomeByCategory.map((item, i) => {
                const pct = currentMonth.income > 0 ? Math.round((item.total / currentMonth.income) * 100) : 0;
                return (
                  <div key={item.category}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{fmt(item.total)}</p>
                  </div>
                );
              })}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-sm font-bold text-green-600">{fmt(currentMonth.income)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Últimas transacciones */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">Últimas transacciones</h2>
            <InfoTooltip text="Los 5 movimientos más recientes. Cada transacción suma a tus ingresos o gastos del mes." />
          </div>
          <button onClick={openModal} className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 bg-green-50 px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nueva transacción
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-3">No hay transacciones aún</p>
            <button onClick={openModal} className="text-sm text-green-600 font-medium hover:text-green-700">
              Registrar primera transacción →
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentTransactions.map((t) => (
              <li key={t._id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                    {t.type === "income" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{t.description}</p>
                    <p className="text-xs text-gray-400">{t.category} · {formatDate(t.date)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold shrink-0 ml-4 ${t.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {recentTransactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <Link href="/transactions" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              Ver todas las transacciones <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">Historial — últimos 6 meses</h2>
            <InfoTooltip text="Comparativa de ingresos vs gastos mes a mes. Te ayuda a detectar tendencias y meses con déficit." />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlySummaries} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" name="Gastos" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">Gastos por categoría</h2>
            <InfoTooltip text="Distribución de tus gastos del mes actual por categoría. Identifica en qué estás gastando más." />
          </div>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="42%" outerRadius={72} label={false}>
                  {categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Sin gastos registrados este mes
            </div>
          )}
        </div>
      </div>

      {/* Insights comparativos del mes */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-semibold text-gray-900">Resumen del mes</h2>
            <InfoTooltip text="Comparativa de tus gastos actuales vs el mes anterior y recordatorios de metas de ahorro." />
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${insight.positive ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}>
                {insight.positive
                  ? <Trophy className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  : <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                <p className="text-sm text-gray-700">{insight.message}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <Link href="/insights" className="text-xs text-green-700 font-medium hover:text-green-900 flex items-center gap-1 w-fit">
              Ver análisis completo <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Planes de ahorro */}
      {savingsPlans.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Planes de ahorro activos</h2>
              <InfoTooltip text="Progreso de tus metas de ahorro. Administra tus planes en la sección Ahorros." />
            </div>
            <Link href="/savings" className="text-xs text-green-700 font-medium hover:text-green-900 flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsPlans.slice(0, 3).map((plan) => {
              const progress = Math.min(100, (plan.currentAmount / plan.targetAmount) * 100);
              return (
                <div key={plan._id} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3">{plan.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{fmt(plan.currentAmount)}</span>
                    <span>{progress.toFixed(0)}%</span>
                    <span>{fmt(plan.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal nueva transacción */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nueva transacción</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, category: "", commitmentId: "" })}
                    className={`flex-1 py-2 rounded-md font-medium text-sm transition-colors ${
                      form.type === t
                        ? t === "income" ? "bg-white text-green-700 shadow-sm" : "bg-white text-red-600 shadow-sm"
                        : "text-gray-500"
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
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {CATEGORIES[form.type].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="¿En qué fue?"
                />
              </div>

              {commitmentOptions.filter((c) => c.type === form.type).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compromiso <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={form.commitmentId}
                    onChange={(e) => setForm({ ...form, commitmentId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="">Sin compromiso</option>
                    {commitmentOptions.filter((c) => c.type === form.type).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50 transition-colors ${
                    form.type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {submitting ? "Guardando..." : form.type === "income" ? "Registrar ingreso" : "Registrar gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
