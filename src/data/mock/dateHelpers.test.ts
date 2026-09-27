import { describe, expect, it } from 'vitest';
import { isoDate } from './dateHelpers';

describe('isoDate', () => {
  it('devuelve la fecha de hoy en formato ISO cuando el offset es 0', () => {
    // Fecha LOCAL (no UTC): de 21 a 24 h en Argentina la fecha UTC ya es la del dia siguiente.
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(isoDate(0)).toBe(hoy);
  });

  it('devuelve una fecha anterior cuando el offset es negativo', () => {
    const resultado = isoDate(-1);
    expect(resultado < isoDate(0)).toBe(true);
  });

  it('devuelve una fecha posterior cuando el offset es positivo', () => {
    const resultado = isoDate(1);
    expect(resultado > isoDate(0)).toBe(true);
  });
});
