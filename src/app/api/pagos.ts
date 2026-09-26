import { api } from './client';

export interface Pago {
  idPago: number;
  idReserva: number;
  monto: number;
  metodoPago: string;
  fechaPago: string;
  observaciones: string | null;
  registradoPor: string | null;
}

export interface CrearPagoInput {
  idReserva: number;
  monto: number;
  metodoPago: string;
  observaciones: string | null;
}

export const pagosApi = {
  getAll: (desde?: string, hasta?: string) => {
    const qs = new URLSearchParams();
    if (desde) qs.set('desde', desde);
    if (hasta) qs.set('hasta', hasta);
    const q = qs.toString();
    return api.get<Pago[]>(`/pagos${q ? `?${q}` : ''}`);
  },
  getByReserva: (idReserva: number) => api.get<Pago[]>(`/pagos/reserva/${idReserva}`),
  create: (dto: CrearPagoInput) => api.post<Pago>('/pagos', dto),
};

export interface Cancelacion {
  idCancelacion: number;
  idReserva: number;
  idUsuario: number;
  motivo: string | null;
  fechaCancelacion: string;
}

export const cancelacionesApi = {
  getAll: () => api.get<Cancelacion[]>('/cancelaciones'),
};

export interface Devolucion {
  idDevolucion: number;
  idCancelacion: number;
  montoDevuelto: number;
  metodo: string;
  fecha: string;
  observaciones: string | null;
  registradoPor: string | null;
}

export interface CrearDevolucionInput {
  idCancelacion: number;
  montoDevuelto: number;
  metodo: string;
  observaciones: string | null;
}

export const devolucionesApi = {
  getAll: () => api.get<Devolucion[]>('/devoluciones'),
  create: (dto: CrearDevolucionInput) => api.post<Devolucion>('/devoluciones', dto),
};
