import React from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { navGroups } from '../components/navConfig';
import { IconLogout } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { usuario, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  const items = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const adminOnlyPaths = ['/usuarios', '/reportes', '/estadisticas'];
      return usuario?.rol === 'administrador' || !adminOnlyPaths.includes(item.path);
    }),
  }));

  return (
    <>
      {isOpen && <div className="sidebar-backdrop d-lg-none" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">SC</span>
          <span className="sidebar-brand-text">Sports Complex</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((group, idx) => (
            <div className="sidebar-group" key={idx}>
              {group.title && <div className="sidebar-group-title">{group.title}</div>}
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  exact={item.path === '/'}
                  className="sidebar-link"
                  activeClassName="active"
                  onClick={onClose}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{usuario?.nombreCompleto.charAt(0) ?? '?'}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{usuario?.nombreCompleto ?? 'Invitado'}</div>
              <div className="sidebar-user-role">{usuario?.rol === 'administrador' ? 'Administrador' : 'Empleado'}</div>
            </div>
          </div>
          <button type="button" className="sidebar-logout" title="Cerrar sesión" onClick={handleLogout}>
            <IconLogout size={17} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
