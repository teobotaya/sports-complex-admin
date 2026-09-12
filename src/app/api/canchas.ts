import { api } from './client';

export interface Cancha {
  idCancha: number;
  nombre: string;
  tipoSuperficie: string | null;
  precioPorHora: number;
  activa: boolean;
}

export interface CrearCanchaInput {
  nombre: string;
  tipoSuperficie: string | null;
  precioPorHora: number;
}

export interface ActualizarCanchaInput extends CrearCanchaInput {
  activa: boolean;
}

export const canchasApi = {
  getAll: () => api.get<Cancha[]>('/canchas'),
  getById: (id: number) => api.get<Cancha>(`/canchas/${id}`),
  create: (dto: CrearCanchaInput) => api.post<Cancha>('/canchas', dto),
  update: (id: number, dto: ActualizarCanchaInput) => api.put<Cancha>(`/canchas/${id}`, dto),
};
