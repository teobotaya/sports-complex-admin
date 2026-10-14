import { describe, it, expect } from 'vitest';
import { ocupaFranja, partidoEnFranja, finPartido } from './horarios';
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
  it('en el listado de reservas un partido figura de su hora de inicio a una hora después', () => {
    expect(finPartido('21:00')).toBe('22:00');
    expect(finPartido('09:00:00')).toBe('10:00');
  });
});

describe('exportar listado', () => {
  it('usa ";" y escapa comillas y separadores', () => {
    expect(aCsv(['A', 'B'], [['x;y', 'dijo "hola"']])).toBe('A;B\r\n"x;y";"dijo ""hola"""');
  });
});
