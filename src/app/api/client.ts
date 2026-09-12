// Cliente HTTP centralizado. Toda comunicación con la API pasa por acá:
// adjunta el token JWT, arma la URL y normaliza errores del backend.

// En desarrollo se apunta directo al backend (el proxy de Vite presenta problemas
// de compatibilidad con esta versión de Node); en producción ambos se sirven
// detrás del mismo dominio y basta con una ruta relativa.
const API_BASE = import.meta.env.DEV ? 'http://localhost:5080/api' : '/api';

const TOKEN_KEY = 'sc_auth_token';
const USER_KEY = 'sc_auth_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Sesión vencida o inválida: se limpia y se fuerza el login nuevamente.
  if (response.status === 401 && token) {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    if (window.location.pathname !== '/login') window.location.href = '/login';
  }

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const message = (data && (data.error || data.title)) || 'Ocurrió un error inesperado.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
