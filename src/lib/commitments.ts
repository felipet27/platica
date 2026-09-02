// Devuelve una fecha concreta dentro de un mes "YYYY-MM" para asociarla a la
// transacción de un gasto variable. Si es el mes en curso usamos el día de hoy;
// para meses pasados o futuros usamos el día 15 al mediodía (evita desbordes de
// zona horaria al calcular inicio/fin de mes, igual que el dashboard).
export function dateForMonth(month?: string | null): Date {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return new Date();
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (month === currentYM) return now;
  return new Date(`${month}-15T12:00:00`);
}
