// Utilidades de fecha seguras frente a zona horaria.
//
// Contexto: los usuarios son de Colombia (UTC-5). Dos errores clásicos que
// evitamos aquí:
//   1. `new Date("2026-09-01")` se interpreta como MEDIANOCHE UTC, que en
//      Colombia es el día anterior a las 19:00 → la fecha "se corre un día".
//   2. `new Date().toISOString()` usa UTC, así que de noche en Colombia ya
//      devuelve la fecha del día siguiente.

/**
 * Fecha de hoy en formato YYYY-MM-DD según la zona horaria LOCAL del navegador.
 * Úsala para inicializar inputs de tipo date, no `toISOString().slice(0, 10)`.
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Normaliza una fecha entrante (desde el cliente) a un Date seguro para guardar.
 * Un valor "solo fecha" (YYYY-MM-DD) se ancla al MEDIODÍA UTC para que el día
 * calendario se conserve al mostrarlo en cualquier zona horaria de América y
 * caiga siempre en el mes correcto. Un ISO completo o un Date se respetan.
 */
export function toStoredDate(input?: string | Date | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(`${input}T12:00:00.000Z`);
  return new Date(input);
}
