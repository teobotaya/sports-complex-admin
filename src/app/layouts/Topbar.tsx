import React, { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { pageTitles } from '../components/navConfig';
import { IconBell, IconMenu } from '../components/Icons';
import { todayLabel } from '../../data/mock';
import { useAuth } from '../context/AuthContext';
import { notificacionesApi, Notificacion, EVENTO_NOTIFICACIONES } from '../api/notificaciones';

interface TopbarProps {
  onToggleSidebar: () => void;
}

function resolveTitle(pathname: string, esAdministrador: boolean): string {
  if (pathname === '/' && !esAdministrador) return 'Hoy';
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/clientes/')) return 'Detalle de Cliente';
  if (pathname.startsWith('/torneos/')) return 'Detalle de Torneo';
  return 'Sports Complex Admin';
}

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const history = useHistory();
  const { usuario } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // La campanita se actualiza al entrar y cada vez que se marcan avisos como leídos.
  React.useEffect(() => {
    if (!usuario) return;
    const recargar = () => notificacionesApi.getMias().then(setNotificaciones).catch(() => setNotificaciones([]));
    recargar();
    window.addEventListener(EVENTO_NOTIFICACIONES, recargar);
    return () => window.removeEventListener(EVENTO_NOTIFICACIONES, recargar);
  }, [usuario]);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-menu-btn d-lg-none" onClick={onToggleSidebar} aria-label="Abrir menú">
          <IconMenu />
        </button>
        <h1 className="topbar-title">{resolveTitle(location.pathname, usuario?.rol === 'administrador')}</h1>
      </div>

      <div className="topbar-right">
        <span className="topbar-date d-none d-md-inline">{todayLabel()}</span>

        <div className="topbar-notif-wrapper">
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setShowNotifs((s) => !s)}
            aria-label="Notificaciones"
          >
            <IconBell />
            {unreadCount > 0 && <span className="topbar-badge">{unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className="topbar-notif-dropdown">
              <div className="topbar-notif-header">Notificaciones</div>
              {notificaciones.slice(0, 4).map((n) => (
                <div key={n.idNotificacion} className={`topbar-notif-item ${n.leida ? '' : 'unread'}`}>
                  <div className="topbar-notif-msg">{n.mensaje}</div>
                  <div className="topbar-notif-date">{new Date(n.fechaCreacion).toLocaleDateString('es-AR')}</div>
                </div>
              ))}
              {notificaciones.length === 0 && <div className="topbar-notif-item">Sin notificaciones</div>}
              <button
                type="button"
                className="topbar-notif-viewall"
                onClick={() => {
                  setShowNotifs(false);
                  history.push('/notificaciones');
                }}
              >
                Ver todas
              </button>
            </div>
          )}
        </div>

        <div className="topbar-user">
          <div className="topbar-user-avatar">{usuario?.nombreCompleto.charAt(0) ?? '?'}</div>
          <span className="topbar-user-name d-none d-md-inline">{usuario?.nombreCompleto ?? 'Invitado'}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
