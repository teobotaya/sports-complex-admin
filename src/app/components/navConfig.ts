// Configuración de navegación del sistema: agrupa las secciones del sidebar
// y sirve como fuente única para el título mostrado en la barra superior.

import React from 'react';
import {
  IconDashboard,
  IconCalendar,
  IconGrid,
  IconUsers,
  IconField,
  IconCard,
  IconUndo,
  IconTrophy,
  IconShield,
  IconWhistle,
  IconBell,
  IconReport,
  IconChart,
  IconUserCog,
} from './Icons';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export interface NavGroup {
  title: string | null;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: null,
    items: [{ path: '/', label: 'Dashboard', icon: IconDashboard }],
  },
  {
    title: 'Gestión',
    items: [
      { path: '/reservas', label: 'Reservas', icon: IconCalendar },
      { path: '/agenda', label: 'Agenda del día', icon: IconGrid },
      { path: '/clientes', label: 'Clientes', icon: IconUsers },
      { path: '/canchas', label: 'Canchas', icon: IconField },
      { path: '/pagos', label: 'Pagos', icon: IconCard },
    ],
  },
  {
    title: 'Torneos',
    items: [
      { path: '/torneos', label: 'Torneos', icon: IconTrophy },
      { path: '/equipos', label: 'Equipos', icon: IconShield },
      { path: '/partidos', label: 'Partidos', icon: IconWhistle },
    ],
  },
  {
    title: 'Administración',
    items: [
      { path: '/cancelaciones', label: 'Cancelaciones y Devoluciones', icon: IconUndo },
      { path: '/notificaciones', label: 'Notificaciones', icon: IconBell },
      { path: '/reportes', label: 'Reportes', icon: IconReport },
      { path: '/estadisticas', label: 'Estadísticas', icon: IconChart },
      { path: '/usuarios', label: 'Usuarios', icon: IconUserCog },
    ],
  },
];

// Mapa auxiliar path -> título de sección, incluye rutas de detalle no presentes en el sidebar.
export const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/reservas': 'Reservas',
  '/agenda': 'Agenda del día',
  '/nueva-reserva': 'Nueva Reserva',
  '/clientes': 'Clientes',
  '/canchas': 'Canchas',
  '/pagos': 'Pagos',
  '/cancelaciones': 'Cancelaciones y Devoluciones',
  '/torneos': 'Torneos',
  '/equipos': 'Equipos',
  '/partidos': 'Partidos',
  '/notificaciones': 'Notificaciones',
  '/reportes': 'Reportes',
  '/estadisticas': 'Estadísticas',
  '/usuarios': 'Usuarios',
};
