import { api } from './client';

/** Una operación registrada automáticamente por el sistema (auditoría). */
export interface HistorialItem {
  idAuditoria: number;
  fechaHora: string;
  usuario: string;
  entidad: string;
  idRegistro: number;
  accion: 'Alta' | 'Modificación' | 'Baja';
  detalle: string | null;
}

export interface Parametro {
  clave: string;
  valor: string;
  descripcion: string | null;
}

export const MINUTOS_INACTIVIDAD = 'minutos_inactividad';

export const parametrosApi = {
  getAll: () => api.get<Parametro[]>('/parametros'),
  update: (clave: string, valor: string) => api.put<Parametro>(`/parametros/${clave}`, { valor }),
};
