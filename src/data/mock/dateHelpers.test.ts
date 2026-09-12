import { describe, expect, it } from 'vitest';
import { isoDate } from './dateHelpers';

describe('isoDate', () => {
  it('devuelve la fecha de hoy en formato ISO cuando el offset es 0', () => {
    const hoy = new Date().toISOString().slice(0, 10);
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
