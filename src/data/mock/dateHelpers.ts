// Utilidad interna para generar fechas relativas a "hoy" y que los datos ficticios
// del prototipo se vean siempre vigentes. No forma parte de la lógica definitiva.

export function isoDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
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
