import { api } from './client';

export interface Usuario {
  idUsuario: number;
  nombreCompleto: string;
  username: string;
  rol: 'administrador' | 'empleado';
  activo: boolean;
  fechaCreacion: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export const authApi = {
  login: (username: string, password: string) => api.post<LoginResponse>('/auth/login', { username, password }),
};

export interface CrearUsuarioInput {
  nombreCompleto: string;
  username: string;
  password: string;
  rol: 'administrador' | 'empleado';
}

export interface ActualizarUsuarioInput {
  nombreCompleto: string;
  rol: 'administrador' | 'empleado';
}

export const usuariosApi = {
  getAll: () => api.get<Usuario[]>('/usuarios'),
  create: (dto: CrearUsuarioInput) => api.post<Usuario>('/usuarios', dto),
  update: (id: number, dto: ActualizarUsuarioInput) => api.put<Usuario>(`/usuarios/${id}`, dto),
  desactivar: (id: number) => api.post<void>(`/usuarios/${id}/desactivar`),
  delete: (id: number) => api.delete<void>(`/usuarios/${id}`),
};
