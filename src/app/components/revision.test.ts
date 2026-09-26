import { describe, it, expect } from 'vitest';
import { ocupaFranja, partidoEnFranja } from './horarios';
import { aCsv } from './exportarCsv';

describe('grilla de la agenda', () => {
  const base = { horaInicio: '18:00', horaFin: '20:00' };
  it('una reserva cancelada deja el horario libre', () => {
    expect(ocupaFranja({ ...base, estadoReserva: 'Cancelada' }, '18:00')).toBe(false);
    expect(ocupaFranja({ ...base, estadoReserva: 'Confirmada' }, '19:00')).toBe(true);
    expect(ocupaFranja({ ...base, estadoReserva: 'Confirmada' }, '20:00')).toBe(false);
  });
  it('un partido ocupa solo su hora de inicio', () => {
    expect(partidoEnFranja({ horaInicio: '20:00' }, '20:00')).toBe(true);
    expect(partidoEnFranja({ horaInicio: '20:00' }, '21:00')).toBe(false);
  });
});

describe('exportar listado', () => {
  it('usa ";" y escapa comillas y separadores', () => {
    expect(aCsv(['A', 'B'], [['x;y', 'dijo "hola"']])).toBe('A;B\r\n"x;y";"dijo ""hola"""');
  });
});
