export const CATEGORIES = {
  income: ["Salario", "Freelance", "Inversiones", "Ventas", "Otros ingresos"],
  expense: [
    "Alimentación",
    "Mercado",
    "Transporte",
    "Pasajes",
    "Vivienda",
    "Salud",
    "Educación",
    "Entretenimiento",
    "Paseos",
    "Ropa",
    "Servicios",
    "Gastos hormiga",
    "Deudas",
    "Otros gastos",
  ],
} as const;

export type ExpenseCategory = (typeof CATEGORIES.expense)[number];
export type IncomeCategory = (typeof CATEGORIES.income)[number];

// Categorías que el sistema monitorea para dar consejos
export const WATCH_CATEGORIES: Record<string, { label: string; tip: string; threshold: number }> = {
  Mercado: {
    label: "Mercado / Alimentación",
    tip: "El gasto en mercado suele ser alto por compras impulsivas. Haz una lista antes de ir y compra en mayoristas cuando puedas.",
    threshold: 0.2,
  },
  Alimentación: {
    label: "Alimentación",
    tip: "Cocinar en casa puede reducir este gasto hasta un 60% comparado con comer fuera constantemente.",
    threshold: 0.2,
  },
  "Gastos hormiga": {
    label: "Gastos hormiga",
    tip: "Los gastos hormiga (café, meriendas, suscripciones pequeñas) se acumulan rápido. Registra todo y elimina lo que no usas.",
    threshold: 0.1,
  },
  Paseos: {
    label: "Paseos y ocio",
    tip: "Limita las salidas de ocio a un presupuesto fijo mensual. Busca actividades gratuitas o de bajo costo como parques y eventos locales.",
    threshold: 0.1,
  },
  Transporte: {
    label: "Transporte",
    tip: "Evalúa si puedes usar transporte público, carpooling o bicicleta para reducir este gasto.",
    threshold: 0.12,
  },
  Pasajes: {
    label: "Pasajes",
    tip: "Compra tiquetes o abonos mensuales en lugar de pagar por viaje individual para ahorrar en transporte.",
    threshold: 0.1,
  },
  Entretenimiento: {
    label: "Entretenimiento",
    tip: "Revisa tus suscripciones digitales (streaming, apps). Elimina las que uses menos de 2 veces por semana.",
    threshold: 0.08,
  },
};
