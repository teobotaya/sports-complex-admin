// Turnos de cancha: solo horas enteras (18:00 a 19:00, 19:00 a 20:00…).
// No se cobran fracciones de hora; las llegadas tarde o temprano se anotan en Observaciones.

export const HORA_APERTURA = 8; // primer turno 08:00
export const HORA_CIERRE = 22; // último turno termina 22:00 (mismo horario que tenía la grilla original: 08 a 21 hs)

export const fmtHora = (h: number): string => `${String(h).padStart(2, '0')}:00`;

/** Horas de la grilla (inicio de cada franja de 1 hora). */
export const HORAS_GRILLA: number[] = Array.from({ length: HORA_CIERRE - HORA_APERTURA }, (_, i) => HORA_APERTURA + i);

/** Opciones válidas para la hora de inicio de un turno. */
export const opcionesInicio = (): string[] => HORAS_GRILLA.map(fmtHora);

/** Opciones válidas para la hora de fin, siempre posteriores al inicio. */
export const opcionesFin = (inicio: string): string[] => {
  const h = parseInt(inicio, 10);
  const desde = Number.isNaN(h) ? HORA_APERTURA + 1 : h + 1;
  return Array.from({ length: HORA_CIERRE - desde + 1 }, (_, i) => fmtHora(desde + i));
};

/** Una reserva ocupa la franja si no está cancelada y la franja cae dentro de su horario. */
export const ocupaFranja = (r: { estadoReserva: string; horaInicio: string; horaFin: string }, hora: string): boolean =>
  r.estadoReserva !== 'Cancelada' && r.horaInicio.slice(0, 5) <= hora && r.horaFin.slice(0, 5) > hora;

/** Un partido de torneo ocupa la cancha 1 hora desde su hora de inicio. */
export const partidoEnFranja = (p: { horaInicio: string }, hora: string): boolean => p.horaInicio.slice(0, 5) === hora;

export const esHoraEntera = (hora: string): boolean => /^\d{2}:00(:00)?$/.test(hora);

/** Dado un inicio, sugiere un fin 1 hora después (o conserva el actual si sigue siendo válido). */
export const ajustarFin = (inicio: string, finActual: string): string => {
  const validos = opcionesFin(inicio);
  return validos.includes(finActual) ? finActual : validos[0] ?? '';
};
