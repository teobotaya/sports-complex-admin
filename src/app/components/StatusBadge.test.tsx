import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('muestra el texto del estado recibido', () => {
    render(<StatusBadge label="Confirmada" />);
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('aplica el tono de éxito para el estado Abonado', () => {
    render(<StatusBadge label="Abonado" />);
    expect(screen.getByText('Abonado')).toHaveClass('badge-success');
  });

  it('aplica el tono de peligro para el estado Cancelada', () => {
    render(<StatusBadge label="Cancelada" />);
    expect(screen.getByText('Cancelada')).toHaveClass('badge-danger');
  });

  it('usa el tono neutral por defecto para un estado desconocido', () => {
    render(<StatusBadge label="Estado inexistente" />);
    expect(screen.getByText('Estado inexistente')).toHaveClass('badge-neutral');
  });
});
