import { api } from './client';

export interface Notificacion {
  idNotificacion: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}

/** Evento que avisa a la campanita que cambió el estado de los avisos. */
export const EVENTO_NOTIFICACIONES = 'sc-notificaciones-actualizadas';
export const avisarCambioNotificaciones = () => window.dispatchEvent(new Event(EVENTO_NOTIFICACIONES));

export const notificacionesApi = {
  getMias: () => api.get<Notificacion[]>('/notificaciones'),
  marcarLeida: (id: number) => api.post<void>(`/notificaciones/${id}/leida`),
  marcarTodasLeidas: () => api.post<void>('/notificaciones/leer-todas'),
};

export interface ReporteOcupacion { idCancha: number; cancha: string; horasUtilizadas: number; horasDisponibles: number; }
/** total = cobrado − devuelto (ingreso neto del período). */
export interface ReporteIngresos { metodoPago: string; cobrado: number; devuelto: number; total: number; }
export interface ReporteDeudor { idCliente: number; cliente: string; idReserva: number; fecha: string; saldoPendiente: number; }

export const reportesApi = {
  getOcupacion: (desde: string, hasta: string, idCancha?: number) =>
    api.get<ReporteOcupacion[]>(`/reportes/ocupacion?desde=${desde}&hasta=${hasta}${idCancha ? `&idCancha=${idCancha}` : ''}`),
  getIngresos: (desde: string, hasta: string, idCancha?: number) =>
    api.get<ReporteIngresos[]>(`/reportes/ingresos?desde=${desde}&hasta=${hasta}${idCancha ? `&idCancha=${idCancha}` : ''}`),
  getDeudores: (idCancha?: number, desde?: string, hasta?: string) => {
    const qs = new URLSearchParams();
    if (idCancha) qs.set('idCancha', String(idCancha));
    if (desde) qs.set('desde', desde);
    if (hasta) qs.set('hasta', hasta);
    const q = qs.toString();
    return api.get<ReporteDeudor[]>(`/reportes/deudores${q ? `?${q}` : ''}`);
  },
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
