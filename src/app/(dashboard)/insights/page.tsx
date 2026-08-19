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
    return <div className="flex items-center justify-center h-64 text-gray-400">Mirando tus números...</div>;
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
    savingsRate >= 20 ? "¡Eso es! Estás guardando lo que se debe." :
    savingsRate >= 10 ? "Vas bien. Puedes darle un poco más." :
    "Hay que meterle más ganas al ahorro.";

  const ruleData = [
    { name: "Necesidades", value: Math.min(rule.needs.actual, 100), target: rule.needs.target, fill: "#f87171", desc: "Vivienda, alimentación, transporte, servicios" },
    { name: "Ocio", value: Math.min(rule.wants.actual, 100), target: rule.wants.target, fill: "#fbbf24", desc: "Entretenimiento, paseos, ropa no esencial" },
    { name: "Ahorro", value: Math.min(Math.max(rule.savings.actual, 0), 100), target: rule.savings.target, fill: "#22c55e", desc: "Ahorros, inversiones, fondo de emergencia" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">¿Cómo va la platíca este mes?</h1>
          <PageInfoTooltip text="Miramos tus datos del mes y te decimos cómo vas. Calculamos cuánto estás guardando, cómo está repartida tu plata y dónde puedes mejorar. Todo con tus números reales." />
        </div>
        <p className="text-gray-500 mt-1">Te mostramos tus números para que sepas dónde ajustar.</p>
      </div>

      {!hasIncome && showNoIncome && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm flex-1">
            {summary.hasIncomeCommitments
              ? <>Tienes ingresos fijos configurados pero aún no los has registrado este mes. Agrégalos desde el{" "}
                  <Link href="/dashboard" className="underline font-medium">inicio</Link> cuando los recibas.</>
              : <>Todavía no hay ingresos de este mes. Agrégalos desde el{" "}
                  <Link href="/dashboard" className="underline font-medium">inicio</Link> para ver el análisis completo.</>
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

      {/* Tasa de ahorro */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">¿Cuánto estás guardando de cada peso?</h2>
              <InfoTooltip text="Lo calculamos así: (lo que entraste − lo que gastaste en consumo) ÷ lo que entraste. Cada peso que metes a tus ahorros sube este número. La meta ideal es el 20%." />
            </div>
            <p className="text-xs text-gray-400">Meta: 20% · Entre más alto, mejor</p>
          </div>
          {hasIncome && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${savingsRate >= 20 ? "bg-green-100 text-green-700" : savingsRate >= 10 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
              {savingsRate >= 20 ? "Meta alcanzada" : "Por mejorar"}
            </span>
          )}
        </div>

        {!hasIncome ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Sin ingresos registrados este mes, no podemos calcular cuánto estás guardando.</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">¿Cuándo empieza a cambiar este número?</p>
              <ol className="space-y-2.5">
                {[
                  { n: 1, text: "Registra los ingresos del mes. Si tienes salario fijo, agrégalo cuando lo recibas." },
                  { n: 2, text: "Controla lo que gastas: entre menos consumas, más alta la tasa." },
                  { n: 3, text: "Cada aporte a tus planes de ahorro sube este número automáticamente." },
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
                  <p>Aportes a ahorros: <span className="font-medium text-green-600">+{fmt(summary.savingsContributions)}</span></p>
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
                Para llegar al 20% no puedes gastar más de{" "}
                <strong>{fmt(summary.monthlyIncome * 0.8)}</strong> este mes.
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
            ¿Cómo está repartida tu plata?
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            La regla 50/30/20: mitad para lo que necesitas · menos del tercio para lo que quieres · el resto al ahorro
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
            Ojo con estos gastos
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
                  extra={a.prevAvg > 0 ? `Mes anterior: ${fmt(a.prevAvg)}` : undefined}
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
            ¿En qué se está yendo la plata?
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
            Esto te conviene saber
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

      {/* Trucos de ahorro */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-green-600" />
          Trucos para que la plata rinda más
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
          Para que no se te escape ni un peso
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPENSE_TIPS.map((s) => (
            <TipCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} color={s.color} />
          ))}
        </div>
      </section>

      {/* Deudas */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-red-500" />
          Con las deudas hay que ser vivo
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
        className="w-5 h-5 rounded-full bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 border border-green-200 flex items-center justify-center text-xs font-bold transition-colors"
        type="button"
        aria-label="¿Cómo se calcula?"
      >
        ?
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
    desc: "El día que te paguen, separa el ahorro antes de gastar. Si el dinero ya no está a la vista, no lo gastas.",
    icon: PiggyBank,
    color: "#22c55e",
  },
  {
    title: "La regla de las 24 horas",
    desc: "Antes de comprar algo que no necesitas, espera un día. Si al otro día todavía lo quieres, cómpralo. Si no, te ahorraste el gasto.",
    icon: Clock,
    color: "#f59e0b",
  },
  {
    title: "Fondo de emergencia",
    desc: "Junta entre 3 y 6 meses de tus gastos fijos. Para el día que se dañe el carro, haya un médico o se presente cualquier imprevisto.",
    icon: ShieldCheck,
    color: "#8b5cf6",
  },
  {
    title: "Presupuesto semanal",
    desc: "Divide tu plata libre mensual en 4 semanas. Es más fácil no gastar de más cuando el límite es semanal y no mensual.",
    icon: Target,
    color: "#3b82f6",
  },
  {
    title: "Compras a granel",
    desc: "En mercado y aseo, comprar en cantidad baja el precio por unidad hasta un 30%. Siempre mira el precio por gramo.",
    icon: ShoppingCart,
    color: "#06b6d4",
  },
  {
    title: "Revisar suscripciones",
    desc: "Una vez al mes, mira qué suscripciones tienes activas. Cancela las que no usas mínimo dos veces por semana.",
    icon: XCircle,
    color: "#ef4444",
  },
];

const EXPENSE_TIPS = [
  {
    title: "Lista antes de comprar",
    desc: "Al mercado con la lista cerrada y sin hambre. Esas dos reglas pueden bajar hasta un 20% lo que gastas cada quincena.",
    icon: BookOpen,
    color: "#22c55e",
  },
  {
    title: "Los gastos hormiga",
    desc: "El café, la merienda, la app de $5.000: todo eso suma. Lleva la cuenta de lo que pagas en efectivo o sin pensar.",
    icon: Coffee,
    color: "#f59e0b",
  },
  {
    title: "Transporte inteligente",
    desc: "Compara lo que pagas por viaje vs un abono mensual. En muchas ciudades el abono ahorra entre el 20% y el 35%.",
    icon: Bus,
    color: "#3b82f6",
  },
  {
    title: "Cocina en casa",
    desc: "Comer afuera cuesta en promedio 4 veces más que cocinar. Planear el menú de la semana también reduce lo que se daña en la nevera.",
    icon: ShoppingCart,
    color: "#8b5cf6",
  },
  {
    title: "Ocio con tope fijo",
    desc: "Ponle un monto fijo mensual al entretenimiento y respétalo. Hay mucho ocio gratuito: parques, eventos y planes sin costo.",
    icon: MapPin,
    color: "#06b6d4",
  },
  {
    title: "Compara antes de pagar",
    desc: "Para compras de más de $50.000, busca mínimo tres precios antes de decidir. El precio más barato no siempre es el primero que ves.",
    icon: TrendingUp,
    color: "#ef4444",
  },
];

const DEBT_TIPS = [
  {
    title: "Método avalancha",
    desc: "Paga el mínimo a todas las deudas y todo lo que sobre mándalo a la de mayor interés. Así reduces lo que pagas en total.",
    icon: TrendingDown,
    color: "#ef4444",
  },
  {
    title: "Método bola de nieve",
    desc: "Paga primero la deuda más pequeña. Te quita un peso de encima rápido y te deja con más plata para atacar las siguientes.",
    icon: Repeat,
    color: "#f59e0b",
  },
  {
    title: "Deuda no es para gastos",
    desc: "El crédito es para activos o emergencias reales, no para vacaciones ni ropa. Financiar eso con tarjeta puede costarte el doble.",
    icon: CreditCard,
    color: "#8b5cf6",
  },
  {
    title: "Negocia la tasa",
    desc: "Si llevas más de 6 meses pagando puntual, llama al banco y pide que te bajen la tasa. Muchos aceptan si tienes buen historial.",
    icon: CheckCircle,
    color: "#22c55e",
  },
  {
    title: "Consolida lo que debes",
    desc: "Si tienes varias cuotas pequeñas, un crédito de consolidación a menor tasa puede bajar lo que pagas en total cada mes.",
    icon: Wallet,
    color: "#3b82f6",
  },
  {
    title: "Nunca pagues solo el mínimo",
    desc: "Pagar solo el mínimo de una tarjeta puede estirar la deuda 5 años. Paga el total siempre que puedas.",
    icon: AlertTriangle,
    color: "#06b6d4",
  },
];
