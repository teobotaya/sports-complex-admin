import { api } from './client';

export interface Cliente {
  idCliente: number;
  nombreCompleto: string;
  telefono: string;
  observaciones: string | null;
  fechaAlta: string;
}

export interface ClienteInput {
  nombreCompleto: string;
  telefono: string;
  observaciones: string | null;
}

export const clientesApi = {
  getAll: (busqueda?: string) => api.get<Cliente[]>(`/clientes${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''}`),
  getById: (id: number) => api.get<Cliente>(`/clientes/${id}`),
  create: (dto: ClienteInput) => api.post<Cliente>('/clientes', dto),
  update: (id: number, dto: ClienteInput) => api.put<Cliente>(`/clientes/${id}`, dto),
  delete: (id: number) => api.delete<void>(`/clientes/${id}`),
};
