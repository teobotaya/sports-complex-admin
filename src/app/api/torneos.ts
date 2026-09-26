import { api } from './client';

export interface Torneo {
  idTorneo: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  categoria: string | null;
  estado: 'Planificado' | 'En curso' | 'Finalizado';
  cantidadEquipos: number;
  cantidadPartidos: number;
}

export interface CrearTorneoInput {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  categoria: string | null;
}

export interface ActualizarTorneoInput extends CrearTorneoInput {
  estado: 'Planificado' | 'En curso' | 'Finalizado';
}

export interface Posicion {
  idEquipo: number;
  equipo: string;
  pj: number; pg: number; pe: number; pp: number;
  gf: number; gc: number; dg: number; pts: number;
}

export interface Equipo {
  idEquipo: number;
  idTorneo: number;
  torneoNombre: string;
  nombre: string;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  cantidadIntegrantes: number;
}

export interface CrearEquipoInput {
  nombre: string;
  contactoNombre: string | null;
  contactoTelefono: string | null;
}

export interface Integrante {
  idIntegrante: number;
  idEquipo: number;
  nombreCompleto: string;
  dni: string;
}

export interface CrearIntegranteInput {
  nombreCompleto: string;
  dni: string;
}

export interface Partido {
  idPartido: number;
  idTorneo: number;
  torneoNombre: string;
  idEquipoLocal: number;
  equipoLocalNombre: string;
  idEquipoVisitante: number;
  equipoVisitanteNombre: string;
  idCancha: number;
  canchaNombre: string;
  fecha: string;
  horaInicio: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  estado: 'Programado' | 'Jugado';
}

export interface CrearPartidoInput {
  idEquipoLocal: number;
  idEquipoVisitante: number;
  idCancha: number;
  fecha: string;
  horaInicio: string;
}

export const torneosApi = {
  getAll: () => api.get<Torneo[]>('/torneos'),
  getById: (id: number) => api.get<Torneo>(`/torneos/${id}`),
  create: (dto: CrearTorneoInput) => api.post<Torneo>('/torneos', dto),
  update: (id: number, dto: ActualizarTorneoInput) => api.put<Torneo>(`/torneos/${id}`, dto),
  getPosiciones: (id: number) => api.get<Posicion[]>(`/torneos/${id}/posiciones`),
  getEquipos: (id: number) => api.get<Equipo[]>(`/torneos/${id}/equipos`),
  agregarEquipo: (id: number, dto: CrearEquipoInput) => api.post<Equipo>(`/torneos/${id}/equipos`, dto),
  getPartidos: (id: number) => api.get<Partido[]>(`/torneos/${id}/partidos`),
  programarPartido: (id: number, dto: CrearPartidoInput) => api.post<Partido>(`/torneos/${id}/partidos`, dto),
};

export const equiposApi = {
  getById: (id: number) => api.get<Equipo>(`/equipos/${id}`),
  quitar: (id: number) => api.delete<void>(`/equipos/${id}`),
  getIntegrantes: (id: number) => api.get<Integrante[]>(`/equipos/${id}/integrantes`),
  agregarIntegrante: (id: number, dto: CrearIntegranteInput) => api.post<Integrante>(`/equipos/${id}/integrantes`, dto),
  quitarIntegrante: (idIntegrante: number) => api.delete<void>(`/equipos/integrantes/${idIntegrante}`),
};

export const partidosApi = {
  getById: (id: number) => api.get<Partido>(`/partidos/${id}`),
  /** Partidos de un día: ocupan la cancha 1 hora desde su hora de inicio. */
  getByFecha: (fecha: string) => api.get<Partido[]>(`/partidos?fecha=${fecha}`),
  registrarResultado: (id: number, golesLocal: number, golesVisitante: number) =>
    api.post<Partido>(`/partidos/${id}/resultado`, { golesLocal, golesVisitante }),
};
