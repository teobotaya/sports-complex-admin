import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, Usuario } from '../api/usuarios';
import { parametrosApi, MINUTOS_INACTIVIDAD } from '../api/auditoria';
import { getToken, setToken as persistToken } from '../api/client';
import { ApiError } from '../api/client';

interface AuthContextValue {
  usuario: Usuario | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = 'sc_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as Usuario) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si no hay token pero hay usuario persistido (o viceversa), limpiar sesión inconsistente.
    if (!getToken() && usuario) {
      setUsuario(null);
      localStorage.removeItem(USER_KEY);
    }
  }, [usuario]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login(username, password);
      persistToken(res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.usuario));
      setUsuario(res.usuario);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('No se pudo conectar con el servidor.', 0);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persistToken(null);
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
  };

  // Cierre automático de sesión por inactividad. Los minutos los define el administrador
  // (Usuarios → Configuración de sesiones); se vuelven a leer en cada verificación.
  useEffect(() => {
    if (!usuario) return;
    let minutos = 30;
    let ultimaActividad = Date.now();
    const leerMinutos = () =>
      parametrosApi.getAll()
        .then((ps) => { minutos = Number(ps.find((p) => p.clave === MINUTOS_INACTIVIDAD)?.valor) || 30; })
        .catch(() => undefined);
    const actividad = () => { ultimaActividad = Date.now(); };
    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    eventos.forEach((ev) => window.addEventListener(ev, actividad, { passive: true }));
    leerMinutos();
    const intervalo = window.setInterval(() => {
      if (Date.now() - ultimaActividad >= minutos * 60_000) {
        logout();
        sessionStorage.setItem('sc_motivo_logout', 'Tu sesión se cerró por inactividad. Volvé a ingresar.');
        window.location.href = '/login';
      }
    }, 30_000);
    const refresco = window.setInterval(leerMinutos, 5 * 60_000);
    return () => {
      eventos.forEach((ev) => window.removeEventListener(ev, actividad));
      window.clearInterval(intervalo);
      window.clearInterval(refresco);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  return <AuthContext.Provider value={{ usuario, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
