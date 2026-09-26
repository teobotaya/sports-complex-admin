import { api } from './client';

export interface Notificacion {
  idNotificacion: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}

export const notificacionesApi = {
  getMias: () => api.get<Notificacion[]>('/notificaciones'),
  marcarLeida: (id: number) => api.post<void>(`/notificaciones/${id}/leida`),
  marcarTodasLeidas: () => api.post<void>('/notificaciones/leer-todas'),
};

export interface ReporteOcupacion { idCancha: number; cancha: string; horasUtilizadas: number; horasDisponibles: number; }
export interface ReporteIngresos { metodoPago: string; total: number; }
export interface ReporteDeudor { idCliente: number; cliente: string; idReserva: number; fecha: string; saldoPendiente: number; }

export const reportesApi = {
  getOcupacion: (desde: string, hasta: string, idCancha?: number) =>
    api.get<ReporteOcupacion[]>(`/reportes/ocupacion?desde=${desde}&hasta=${hasta}${idCancha ? `&idCancha=${idCancha}` : ''}`),
  getIngresos: (desde: string, hasta: string, idCancha?: number) =>
    api.get<ReporteIngresos[]>(`/reportes/ingresos?desde=${desde}&hasta=${hasta}${idCancha ? `&idCancha=${idCancha}` : ''}`),
  getDeudores: (idCancha?: number) =>
    api.get<ReporteDeudor[]>(`/reportes/deudores${idCancha ? `?idCancha=${idCancha}` : ''}`),
};

export interface HorarioPico { hora: number; cantidadReservas: number; }
export interface ClienteFrecuente { idCliente: number; cliente: string; cantidadReservas: number; }
export interface EstadisticasResumen {
  tasaCancelaciones: number;
  horariosPico: HorarioPico[];
  clientesFrecuentes: ClienteFrecuente[];
  ocupacion: ReporteOcupacion[];
  ingresos: ReporteIngresos[];
}

export const estadisticasApi = {
  getResumen: (desde: string, hasta: string) => api.get<EstadisticasResumen>(`/estadisticas?desde=${desde}&hasta=${hasta}`),
};
