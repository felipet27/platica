"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  PiggyBank,
  Lightbulb,
  ShoppingCart,
  Coffee,
  MapPin,
  Bus,
  CheckCircle,
  XCircle,
  Target,
  CreditCard,
  BookOpen,
  Repeat,
  Wallet,
  TrendingUp,
  Clock,
  ShieldCheck,
  X,
  Info,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";

interface Alert {
  category: string;
  label: string;
  amount: number;
  percent: number;
  prevAvg: number;
  tip: string;
  severity: "high" | "medium" | "low";
}

interface InsightsData {
  summary: {
    monthlyIncome: number;
    totalExpense: number;
    balance: number;
    savingsRate: number;
    projectedExpense: number;
    savingsContributions: number;
    hasIncomeCommitments: boolean;
  };
  alerts: Alert[];
  hormigaAlert: { label: string; amount: number; count: number; percent: number; tip: string; severity: "high" | "medium" } | null;
  savingsTips: string[];
  expenseByCategory: { category: string; amount: number; count: number; percent: number }[];
  rule: {
    needs: { target: number; actual: number };
    wants: { target: number; actual: number };
    savings: { target: number; actual: number };
  };
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Mercado: ShoppingCart,
  Alimentación: ShoppingCart,
  "Gastos hormiga": Coffee,
  Paseos: MapPin,
  Transporte: Bus,
  Pasajes: Bus,
  Entretenimiento: MapPin,
};

const SEVERITY_STYLES = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-blue-200 bg-blue-50",
};

const SEVERITY_ICON_STYLES = {
  high: "text-red-500 bg-red-100",
  medium: "text-amber-500 bg-amber-100",
  low: "text-blue-500 bg-blue-100",
};

export default function InsightsPage() {
  const { fmt } = useSettings();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNoIncome, setShowNoIncome] = useState<boolean>(() =>
    typeof window === "undefined" ? true : sessionStorage.getItem("platica_insights_no_income") !== "true"
  );
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const stored = sessionStorage.getItem("platica_insights_alerts");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [dismissedTips, setDismissedTips] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set<number>();
    try {
      const stored = sessionStorage.getItem("platica_insights_tips");
      return stored ? new Set<number>(JSON.parse(stored)) : new Set<number>();
    } catch { return new Set<number>(); }
  });

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Analizando tus finanzas...</div>;
  }

  if (!data) return null;

  const { summary, alerts, hormigaAlert, savingsTips, expenseByCategory, rule } = data;
  const hasIncome = summary.monthlyIncome > 0;
  const savingsRate = Math.max(0, summary.savingsRate);

  const savingsColor =
    savingsRate >= 20 ? "text-green-600" : savingsRate >= 10 ? "text-amber-500" : "text-red-500";
  const savingsBg =
    savingsRate >= 20 ? "bg-green-500" : savingsRate >= 10 ? "bg-amber-400" : "bg-red-500";
  const savingsLabel =
    savingsRate >= 20 ? "¡Excelente! Estás en la meta del 20%" :
    savingsRate >= 10 ? "Bien, pero puedes mejorar. Meta: 20%" :
    "Por debajo de lo recomendado. Meta: 20%";

  const ruleData = [
    { name: "Necesidades", value: Math.min(rule.needs.actual, 100), target: rule.needs.target, fill: "#f87171", desc: "Vivienda, alimentación, transporte, servicios" },
    { name: "Ocio", value: Math.min(rule.wants.actual, 100), target: rule.wants.target, fill: "#fbbf24", desc: "Entretenimiento, paseos, ropa no esencial" },
    { name: "Ahorro", value: Math.min(Math.max(rule.savings.actual, 0), 100), target: rule.savings.target, fill: "#22c55e", desc: "Ahorros, inversiones, fondo de emergencia" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Consejos financieros</h1>
          <PageInfoTooltip text="Análisis automático de tus hábitos financieros. Calcula tu tasa de ahorro mensual, aplica la regla 50/30/20, detecta categorías de gasto que aumentaron demasiado y te da recomendaciones personalizadas según tus datos reales." />
        </div>
        <p className="text-gray-500 mt-1">Análisis de tus hábitos con recomendaciones para mejorar</p>
      </div>

      {!hasIncome && showNoIncome && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm flex-1">
            {summary.hasIncomeCommitments
              ? <>Tienes ingresos fijos configurados pero aún no los has registrado como transacciones este mes. Regístralos desde el{" "}
                  <Link href="/dashboard" className="underline font-medium">Dashboard</Link> cuando los recibas.</>
              : <>No tienes ingresos registrados este mes. Agrégalos desde el{" "}
                  <Link href="/dashboard" className="underline font-medium">Dashboard</Link> para ver el análisis completo.</>
            }
          </p>
          <button
            onClick={() => { setShowNoIncome(false); sessionStorage.setItem("platica_insights_no_income", "true"); }}
            className="text-amber-400 hover:text-amber-700 transition-colors shrink-0"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tasa de ahorro — protagonista */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Tu tasa de ahorro este mes</h2>
              <InfoTooltip text="Mide qué porcentaje de tus ingresos no se fue en consumo. Fórmula: (Ingresos − Gastos de consumo) ÷ Ingresos. Los aportes a planes de ahorro no cuentan como consumo — suben la tasa. Meta recomendada: 20%." />
            </div>
            <p className="text-xs text-gray-400">(Ingresos − Gastos de consumo) ÷ Ingresos · Meta: 20%</p>
          </div>
          {hasIncome && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${savingsRate >= 20 ? "bg-green-100 text-green-700" : savingsRate >= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
              {savingsRate >= 20 ? "Meta alcanzada" : "Por mejorar"}
            </span>
          )}
        </div>

        {!hasIncome ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Aún no hay ingresos registrados este mes — no es posible calcular la tasa.</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">¿Cuándo empieza a cambiar este número?</p>
              <ol className="space-y-2.5">
                {[
                  { n: 1, text: "Registra tus ingresos del mes como transacciones en el Dashboard. Si tienes un salario fijo, también regístralo ahí cuando lo recibas." },
                  { n: 2, text: "Controla tus gastos de consumo: mientras menos gastes en consumo, más alta la tasa." },
                  { n: 3, text: "Aporta a tus planes de ahorro: cada aporte registrado sube automáticamente la tasa." },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</span>
                    {text}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-4 mb-4">
              <p className={`text-5xl font-bold ${savingsColor}`}>{savingsRate.toFixed(1)}%</p>
              <div className="pb-1 text-sm text-gray-400 space-y-0.5">
                <p>Ingresos: <span className="font-medium text-gray-700">{fmt(summary.monthlyIncome)}</span></p>
                <p>Gastos: <span className="font-medium text-gray-700">{fmt(summary.totalExpense - summary.savingsContributions)}</span></p>
                {summary.savingsContributions > 0 && (
                  <p>Aportes a planes: <span className="font-medium text-green-600">+{fmt(summary.savingsContributions)}</span></p>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-3 relative">
              <div className={`h-3 rounded-full transition-all ${savingsBg}`} style={{ width: `${Math.min(savingsRate, 100)}%` }} />
              <div className="absolute top-0 h-3 w-0.5 bg-gray-400" style={{ left: "20%" }} title="Meta 20%" />
            </div>
            <p className={`text-sm font-medium ${savingsColor}`}>{savingsLabel}</p>
            {savingsRate < 20 && (
              <p className="text-xs text-gray-400 mt-1">
                Para llegar al 20% deberías gastar máximo{" "}
                <strong>{fmt(summary.monthlyIncome * 0.8)}</strong> en consumo este mes.
                Llevas <strong>{fmt(summary.totalExpense - summary.savingsContributions)}</strong>.
              </p>
            )}
          </>
        )}
      </div>

      {/* Regla 50/30/20 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Distribución ideal: regla 50/30/20
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            50% para necesidades · 30% para ocio · 20% para ahorro
          </p>
        </div>
        <div className="space-y-5">
          {ruleData.map((r) => (
            <div key={r.name}>
              <div className="flex justify-between text-sm mb-1">
                <div>
                  <span className="font-medium text-gray-800">{r.name}</span>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-bold text-gray-800">{r.value.toFixed(1)}%</span>
                  <p className="text-xs text-gray-400">meta {r.target}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 relative">
                <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(r.value, 100)}%`, backgroundColor: r.fill }} />
                <div className="absolute top-0 h-3 w-0.5 bg-gray-500 opacity-50" style={{ left: `${r.target}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas de gasto */}
      {(alerts.length > 0 || hormigaAlert) && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Categorías a revisar este mes
          </h2>
          <div className="space-y-3">
            {hormigaAlert && !dismissedAlerts.has("hormiga") && (
              <AlertCard
                icon={Coffee}
                label={hormigaAlert.label}
                amount={hormigaAlert.amount}
                percent={hormigaAlert.percent}
                tip={hormigaAlert.tip}
                severity={hormigaAlert.severity}
                extra={`${hormigaAlert.count} transacciones pequeñas`}
                onDismiss={() => {
                  const next = new Set([...dismissedAlerts, "hormiga"]);
                  setDismissedAlerts(next);
                  sessionStorage.setItem("platica_insights_alerts", JSON.stringify([...next]));
                }}
              />
            )}
            {alerts.filter((a) => !dismissedAlerts.has(a.category)).map((a) => {
              const Icon = CATEGORY_ICONS[a.category] ?? TrendingDown;
              return (
                <AlertCard
                  key={a.category}
                  icon={Icon}
                  label={a.label}
                  amount={a.amount}
                  percent={a.percent}
                  tip={a.tip}
                  severity={a.severity}
                  extra={a.prevAvg > 0 ? `Promedio anterior: ${fmt(a.prevAvg)}` : undefined}
                  onDismiss={() => {
                    const next = new Set([...dismissedAlerts, a.category]);
                    setDismissedAlerts(next);
                    sessionStorage.setItem("platica_insights_alerts", JSON.stringify([...next]));
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Distribución de gastos */}
      {expenseByCategory.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-gray-500" />
            ¿En qué estás gastando?
          </h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            {expenseByCategory.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{c.category}</span>
                  <span className="text-gray-500">
                    {fmt(c.amount)}{" "}
                    <span className="text-gray-400">({c.percent.toFixed(1)}% de ingresos)</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${c.percent > 25 ? "bg-red-400" : c.percent > 15 ? "bg-amber-400" : "bg-green-400"}`}
                    style={{ width: `${Math.min(c.percent * 2, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recomendaciones personalizadas */}
      {savingsTips.filter((_, i) => !dismissedTips.has(i)).length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Recomendaciones para ti
          </h2>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <ul className="space-y-3">
              {savingsTips.map((tip, i) => dismissedTips.has(i) ? null : (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="flex-1">{tip}</span>
                  <button
                    onClick={() => {
                      const next = new Set([...dismissedTips, i]);
                      setDismissedTips(next);
                      sessionStorage.setItem("platica_insights_tips", JSON.stringify([...next]));
                    }}
                    className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                    aria-label="Cerrar recomendación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Estrategias de ahorro */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-green-600" />
          Estrategias de ahorro
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAVING_STRATEGIES.map((s) => (
            <TipCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} color={s.color} />
          ))}
        </div>
      </section>

      {/* Control de gastos */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          Cómo controlar tus gastos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPENSE_TIPS.map((s) => (
            <TipCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} color={s.color} />
          ))}
        </div>
      </section>

      {/* Hábitos de deuda */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-red-500" />
          Manejo inteligente de deudas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEBT_TIPS.map((s) => (
            <TipCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} color={s.color} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TipCard({ icon: Icon, title, desc, color }: { icon: React.ElementType; title: string; desc: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

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
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl leading-relaxed">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

function AlertCard({ icon: Icon, label, amount, percent, tip, severity, extra, onDismiss }: {
  icon: React.ElementType; label: string; amount: number; percent: number;
  tip: string; severity: "high" | "medium" | "low"; extra?: string; onDismiss?: () => void;
}) {
  const { fmt } = useSettings();
  return (
    <div className={`rounded-2xl border p-5 ${SEVERITY_STYLES[severity]}`}>
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${SEVERITY_ICON_STYLES[severity]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="font-semibold text-gray-900">{label}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-gray-700">
                {fmt(amount)} <span className="font-normal text-gray-400">({percent.toFixed(1)}%)</span>
              </span>
              {onDismiss && (
                <button onClick={onDismiss} className="text-gray-300 hover:text-gray-500 transition-colors" aria-label="Cerrar alerta">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {extra && <p className="text-xs text-gray-500 mb-2">{extra}</p>}
          <p className="text-sm text-gray-600">{tip}</p>
        </div>
      </div>
    </div>
  );
}

const SAVING_STRATEGIES = [
  {
    title: "Págate primero",
    desc: 'Transfiere el 20% de tu ingreso el día de pago antes de gastar. Así ahorras sin esfuerzo porque el dinero ya no está disponible.',
    icon: PiggyBank,
    color: "#22c55e",
  },
  {
    title: "Regla de las 24 horas",
    desc: "Antes de comprar algo no esencial, espera 24 horas. Reduce las compras impulsivas hasta en un 40%.",
    icon: Clock,
    color: "#f59e0b",
  },
  {
    title: "Fondo de emergencia",
    desc: "Meta: 3 a 6 meses de tus gastos fijos ahorrados. Te evita endeudarte ante imprevistos médicos, mecánicos o de trabajo.",
    icon: ShieldCheck,
    color: "#8b5cf6",
  },
  {
    title: "Presupuesto semanal",
    desc: "Divide tu dinero libre mensual entre 4 semanas. Es más fácil controlar un presupuesto semanal que uno mensual.",
    icon: Target,
    color: "#3b82f6",
  },
  {
    title: "Compras a granel",
    desc: "En mercado y artículos de aseo, comprar en cantidad reduce el costo por unidad hasta un 30%. Compara precio por gramo.",
    icon: ShoppingCart,
    color: "#06b6d4",
  },
  {
    title: "Elimina suscripciones",
    desc: "Revisa cada mes qué suscripciones tienes activas (streaming, apps, membresías). Cancela las que no usas al menos 2 veces por semana.",
    icon: XCircle,
    color: "#ef4444",
  },
];

const EXPENSE_TIPS = [
  {
    title: "Lista antes de comprar",
    desc: "Ir al mercado con lista cerrada reduce el gasto promedio un 23%. Nunca vayas con hambre.",
    icon: BookOpen,
    color: "#22c55e",
  },
  {
    title: "Revisa gastos hormiga",
    desc: "Café, meriendas, apps pequeñas: suman más de lo que crees. Lleva un registro de todo lo que pagas con efectivo.",
    icon: Coffee,
    color: "#f59e0b",
  },
  {
    title: "Transporte inteligente",
    desc: "Evalúa abonos mensuales de transporte vs pago por viaje. En muchas ciudades el abono ahorra entre 20% y 35%.",
    icon: Bus,
    color: "#3b82f6",
  },
  {
    title: "Cocina en casa",
    desc: "Comer fuera cuesta en promedio 4 veces más que cocinar. Planear el menú semanal reduce también el desperdicio de alimentos.",
    icon: ShoppingCart,
    color: "#8b5cf6",
  },
  {
    title: "Ocio con presupuesto fijo",
    desc: "Asigna un monto fijo mensual para entretenimiento y respétalo. Busca alternativas gratuitas: parques, eventos locales, bibliotecas.",
    icon: MapPin,
    color: "#06b6d4",
  },
  {
    title: "Compara antes de pagar",
    desc: "Para compras mayores a $50.000, busca al menos 3 precios antes de decidir. Apps de comparación y grupos de Facebook de segunda mano ayudan.",
    icon: TrendingUp,
    color: "#ef4444",
  },
];

const DEBT_TIPS = [
  {
    title: "Método avalancha",
    desc: "Paga el mínimo a todas las deudas y todo el excedente a la de mayor interés. Reduces el costo total de la deuda significativamente.",
    icon: TrendingDown,
    color: "#ef4444",
  },
  {
    title: "Método bola de nieve",
    desc: "Paga primero la deuda más pequeña. Da motivación rápida y libera cuotas para atacar las siguientes.",
    icon: Repeat,
    color: "#f59e0b",
  },
  {
    title: "No uses deuda para gastos",
    desc: "Reserva el crédito para activos o emergencias reales. Financiar vacaciones o ropa con tarjeta puede costarte el doble.",
    icon: CreditCard,
    color: "#8b5cf6",
  },
  {
    title: "Negocia las tasas",
    desc: "Si llevas más de 6 meses pagando puntual, llama al banco y pide reducción de tasa. Muchos bancos aceptan si el cliente tiene buen historial.",
    icon: CheckCircle,
    color: "#22c55e",
  },
  {
    title: "Consolida deudas",
    desc: "Si tienes varias cuotas pequeñas, un crédito de consolidación a menor tasa puede reducir tu pago mensual total.",
    icon: Wallet,
    color: "#3b82f6",
  },
  {
    title: "Evita mínimos en tarjeta",
    desc: "Pagar solo el mínimo de una tarjeta de crédito puede extender la deuda 5 años. Paga siempre el total si puedes.",
    icon: AlertTriangle,
    color: "#06b6d4",
  },
];
