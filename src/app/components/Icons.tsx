// Conjunto reducido de iconos SVG en línea (sin dependencias externas) utilizados
// en la barra lateral y la barra superior del prototipo.

import React from 'react';

type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconDashboard = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
);
export const IconCalendar = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
);
export const IconGrid = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
);
export const IconUsers = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="17.5" cy="8.5" r="2.5" /><path d="M15.8 14.8c2.7.4 4.7 2.3 4.7 5.2" /></svg>
);
export const IconField = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="2.5" y="4" width="19" height="16" rx="1.5" /><circle cx="12" cy="12" r="3.2" /><path d="M12 4v3M12 17v3M2.5 12h4M17.5 12h4" /></svg>
);
export const IconCard = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 9.5h19M6 14.5h4" /></svg>
);
export const IconUndo = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M9 5 4 10l5 5" /><path d="M4 10h9.5A5.5 5.5 0 0 1 19 15.5v0A5.5 5.5 0 0 1 13.5 21H8" /></svg>
);
export const IconTrophy = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10M17 5h3v1.5A3.5 3.5 0 0 1 17 10" /><path d="M12 13v4M9 21h6M9.5 21c0-2 1-3 2.5-3s2.5 1 2.5 3" /></svg>
);
export const IconShield = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M12 3 4.5 6v6c0 4.5 3 8 7.5 9 4.5-1 7.5-4.5 7.5-9V6L12 3Z" /></svg>
);
export const IconWhistle = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><circle cx="9" cy="12" r="6" /><path d="M15 12h4a2 2 0 0 0 2-2V8h-3M9 9v0M9 15v0" /></svg>
);
export const IconBell = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
);
export const IconReport = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
);
export const IconChart = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2 20h20" /></svg>
);
export const IconUserCog = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="18" cy="15" r="2" /><path d="M18 12.3v.7M18 17v.7M20.4 13.5l-.6.35M15.6 16.15l-.6.35M20.4 16.5l-.6-.35M15.6 13.85l-.6-.35" /></svg>
);
export const IconLogout = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconMenu = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);
export const IconPlus = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconSearch = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
);
