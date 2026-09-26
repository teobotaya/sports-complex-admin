import { describe, it, expect } from 'vitest';
import { opcionesInicio, opcionesFin, ajustarFin, esHoraEntera } from './horarios';

describe('horarios de turnos', () => {
  it('solo ofrece horas enteras', () => {
    expect(opcionesInicio().every((h) => h.endsWith(':00'))).toBe(true);
    expect(opcionesInicio()[0]).toBe('08:00');
  });
  it('la hora de fin siempre es posterior al inicio', () => {
    expect(opcionesFin('18:00')[0]).toBe('19:00');
  });
  it('sugiere 1 hora de duración al elegir el inicio', () => {
    expect(ajustarFin('18:00', '')).toBe('19:00');
    expect(ajustarFin('18:00', '20:00')).toBe('20:00');
    expect(ajustarFin('19:00', '19:00')).toBe('20:00');
  });
  it('detecta horas fraccionadas', () => {
    expect(esHoraEntera('19:01')).toBe(false);
    expect(esHoraEntera('19:00')).toBe(true);
  });
});
