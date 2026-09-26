import { api } from './client';
import { HistorialItem } from './auditoria';

export interface Reserva {
  idReserva: number;
  idCliente: number;
  clienteNombre: string;
  idCancha: number;
  canchaNombre: string;
  idUsuario: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estadoReserva: 'Confirmada' | 'Pendiente' | 'Cancelada';
  estadoPago: 'Pendiente' | 'Parcialmente abonado' | 'Abonado';
  asistencia: 'Presente' | 'Ausente' | null;
  observaciones: string | null;
  fechaCreacion: string;
}

export interface CrearReservaInput {
  idCliente: number;
  idCancha: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  observaciones: string | null;
}

export interface ActualizarReservaInput {
  idCancha: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  observaciones: string | null;
}

export const reservasApi = {
  getAll: (params?: { fecha?: string; desde?: string; hasta?: string; idCancha?: number; idCliente?: number; estado?: string }) => {
    const qs = new URLSearchParams();
    if (params?.fecha) qs.set('fecha', params.fecha);
    if (params?.desde) qs.set('desde', params.desde);
    if (params?.hasta) qs.set('hasta', params.hasta);
    if (params?.idCancha) qs.set('idCancha', String(params.idCancha));
    if (params?.idCliente) qs.set('idCliente', String(params.idCliente));
    if (params?.estado) qs.set('estado', params.estado);
    const query = qs.toString();
    return api.get<Reserva[]>(`/reservas${query ? `?${query}` : ''}`);
  },
  getById: (id: number) => api.get<Reserva>(`/reservas/${id}`),
  create: (dto: CrearReservaInput) => api.post<Reserva>('/reservas', dto),
  update: (id: number, dto: ActualizarReservaInput) => api.put<Reserva>(`/reservas/${id}`, dto),
  cancelar: (id: number, motivo: string | null) => api.post<void>(`/reservas/${id}/cancelar`, { motivo }),
  registrarAsistencia: (id: number, asistencia: 'Presente' | 'Ausente') =>
    api.put<Reserva>(`/reservas/${id}/asistencia`, { asistencia }),
  getHistorial: (id: number) => api.get<HistorialItem[]>(`/reservas/${id}/historial`),
};
