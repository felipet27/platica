"use client";

import { useSettings, CURRENCIES } from "@/contexts/SettingsContext";
import {
  Settings,
  Check,
  LayoutDashboard,
  Repeat2,
  ArrowRightLeft,
  PiggyBank,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageInfoTooltip } from "@/components/ui/PageInfoTooltip";
import { useState } from "react";

// ─── Datos de la guía ────────────────────────────────────────────────────────

const SECTIONS = [
  {
    icon: LayoutDashboard,
    color: "bg-green-100 text-green-700",
    border: "border-green-200",
    name: "El resumen",
    tagline: "Tu cuartel general financiero.",
    description:
      "Acá ves todo el mes de un vistazo: cuánto entraste, cuánto gastaste y cuánto te queda libre. También aparecen tus compromisos pendientes, un consejo rápido y los últimos movimientos.",
    bullets: [
      "El «Balance del mes» es la diferencia real entre lo que entraste y lo que salió.",
      "El «Libre estimado» es lo que debería sobrar después de tus compromisos fijos y tus aportes a ahorro.",
      "Los recordatorios de pago te avisan cuando un compromiso está por vencer o ya venció.",
    ],
  },
  {
    icon: Repeat2,
    color: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
    name: "Compromisos",
    tagline: "Lo que siempre llega, mes a mes.",
    description:
      "Aquí viven los ingresos y gastos fijos: el arriendo, los servicios, el salario, la cuota del carro. Los configuras una vez y Platíca los recuerda por ti.",
    bullets: [
      "Cuando pagas un gasto fijo o recibes un ingreso, lo marcas como «Pagado» o «Recibido» — eso genera automáticamente el movimiento en tu historial.",
      "Puedes indicar el día del mes en que suele llegar para activar los recordatorios.",
      "Los compromisos de cuotas se desactivan solos cuando terminas de pagarlos.",
    ],
  },
  {
    icon: ArrowRightLeft,
    color: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
    name: "Transacciones",
    tagline: "El historial completo de tus movimientos.",
    description:
      "Platíca genera los movimientos automáticamente cuando pagas compromisos o haces aportes a ahorros. Pero si saliste de paseo, fuiste a comer o tuviste un gasto puntual, anótalo aquí con la fecha real en que ocurrió — aunque lo estés registrando días después.",
    bullets: [
      "Usa «Anotar movimiento» para cualquier gasto o ingreso que no venga de un compromiso.",
      "Siempre puedes cambiar la fecha para que quede con el día real del gasto.",
      "Todos los movimientos alimentan el balance, las gráficas y los consejos.",
    ],
  },
  {
    icon: PiggyBank,
    color: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    name: "Ahorros",
    tagline: "Tus metas, una por una.",
    description:
      "Crea planes de ahorro para lo que quieras: el fondo de emergencia, las vacaciones, el carro, lo que sea. Cada vez que apartas plata, registras un aporte y Platíca lleva la cuenta de cuánto te falta.",
    bullets: [
      "Cada aporte se refleja en tu libre estimado: si ahorrás, ese dinero ya no está «libre».",
      "Puedes dejar una nota en cada aporte para recordar por qué lo hiciste.",
      "Si eliminas un plan, Platíca te pregunta si el dinero sigue disponible o ya no está.",
    ],
  },
  {
    icon: Lightbulb,
    color: "bg-orange-100 text-orange-700",
    border: "border-orange-200",
    name: "Consejos financieros",
    tagline: "Platíca analiza y te habla directo.",
    description:
      "Aquí Platíca revisa tus números del mes y te dice cómo vas: si un gasto subió comparado al mes pasado, si los gastos pequeños se están acumulando, o si tu tasa de ahorro está bien.",
    bullets: [
      "Las alertas aparecen cuando una categoría supera el umbral saludable de tus ingresos.",
      "Los «gastos hormiga» son muchas transacciones pequeñas que juntas pesan bastante.",
      "La regla 50/30/20 te muestra cómo distribuir: necesidades, gustos y ahorro.",
    ],
  },
];

const GLOSSARY = [
  {
    term: "Balance del mes",
    def: "Ingresos reales del mes menos todos los gastos registrados. Es lo que te sobra (o te falta) según los movimientos concretos.",
  },
  {
    term: "Libre estimado",
    def: "Lo que debería estar disponible: ingresos menos compromisos fijos menos aportes a ahorros. Es una proyección, no un saldo exacto.",
  },
  {
    term: "Compromisos",
    def: "Gastos e ingresos recurrentes que se repiten cada mes (arriendo, salario, Netflix…). No son movimientos aún — se convierten en movimientos cuando los marcas como pagados.",
  },
  {
    term: "Anotar movimiento",
    def: "Registrar manualmente un gasto o ingreso puntual que no viene de un compromiso. Siempre puedes poner la fecha real.",
  },
  {
    term: "Aporte",
    def: "Dinero que metes a un plan de ahorro. Genera un movimiento de gasto en tu historial y reduce tu libre estimado.",
  },
  {
    term: "Gastos hormiga",
    def: "Muchas compras pequeñas que individualmente parecen insignificantes pero juntas suman bastante al mes.",
  },
  {
    term: "Regla 50/30/20",
    def: "Guía de distribución del ingreso: 50% para necesidades básicas, 30% para gustos y ocio, 20% para ahorro.",
  },
];

// ─── Componente acordeón del glosario ────────────────────────────────────────

function GlossaryItem({ term, def }: { term: string; def: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 text-left gap-4"
      >
        <span className="text-sm font-semibold text-gray-800">{term}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>
      {open && <p className="text-sm text-gray-500 pb-3 leading-relaxed">{def}</p>}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { currency, setCurrency } = useSettings();

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <PageInfoTooltip text="Personaliza Platíca y aprende cómo sacarle el máximo provecho." />
        </div>
        <p className="text-gray-500 text-sm mt-1">Preferencias y guía de uso</p>
      </div>

      {/* Moneda */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Settings className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Moneda</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Selecciona la moneda en la que quieres ver todos los valores de la app.
          </p>
          <div className="space-y-2">
            {CURRENCIES.map(({ code, label, symbol }) => {
              const active = currency === code;
              return (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                    active
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold w-8 text-center ${active ? "text-green-700" : "text-gray-400"}`}>
                      {symbol}
                    </span>
                    <div>
                      <p className={`font-medium ${active ? "text-green-900" : "text-gray-700"}`}>{label}</p>
                      <p className="text-xs text-gray-400">{code}</p>
                    </div>
                  </div>
                  {active && <Check className="w-5 h-5 text-green-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cómo funciona Platíca */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">¿Cómo funciona Platíca?</h2>
          <p className="text-sm text-gray-500 mt-1">
            Todo tiene un lugar. Aquí te explicamos para qué sirve cada sección.
          </p>
        </div>

        <div className="relative">
          {/* Línea vertical conectora */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gray-100 hidden sm:block" />

          <div className="space-y-4">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="relative flex gap-4">
                  {/* Ícono numerado */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} relative z-10`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-gray-300 font-bold mt-1">{String(i + 1).padStart(2, "0")}</span>
                  </div>

                  {/* Contenido */}
                  <div className={`flex-1 bg-white rounded-2xl border ${s.border} p-5 shadow-sm`}>
                    <p className="font-bold text-gray-900 text-base">{s.name}</p>
                    <p className="text-xs font-medium text-gray-400 mb-2">{s.tagline}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.description}</p>
                    <ul className="space-y-1.5">
                      {s.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Glosario de términos */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Glosario rápido</h2>
          <p className="text-xs text-gray-400 mt-0.5">Toca cualquier término para ver qué significa.</p>
        </div>
        <div className="px-6 py-2">
          {GLOSSARY.map((g) => (
            <GlossaryItem key={g.term} term={g.term} def={g.def} />
          ))}
        </div>
      </div>

    </div>
  );
}
