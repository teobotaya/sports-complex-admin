// Utilidad interna para generar fechas relativas a "hoy" y que los datos ficticios
// del prototipo se vean siempre vigentes. No forma parte de la lógica definitiva.

/** Fecha local en formato AAAA-MM-DD. No usar toISOString(): convierte a UTC y
 *  después de las 21:00 (hora argentina) devolvía la fecha del día siguiente. */
export function fechaLocalIso(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function isoDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return fechaLocalIso(d);
}

export function todayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
