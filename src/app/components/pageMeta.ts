import { pageTitles } from './navConfig';

const APP_NAME = 'Sports Complex Admin';
const ICON_BG = '#0E8A55';

function buildFavicon(inner: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">` +
    `<rect width="24" height="24" rx="6" fill="${ICON_BG}"/>` +
    `<g fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform="translate(2 2) scale(0.83)">${inner}</g>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const favicons: Record<string, string> = {
  '/': buildFavicon('<rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />'),
  '/reservas': buildFavicon('<rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />'),
  '/nueva-reserva': buildFavicon('<rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" />'),
  '/agenda': buildFavicon('<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />'),
  '/clientes': buildFavicon('<circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="17.5" cy="8.5" r="2.5" /><path d="M15.8 14.8c2.7.4 4.7 2.3 4.7 5.2" />'),
  '/canchas': buildFavicon('<rect x="2.5" y="4" width="19" height="16" rx="1.5" /><circle cx="12" cy="12" r="3.2" /><path d="M12 4v3M12 17v3M2.5 12h4M17.5 12h4" />'),
  '/pagos': buildFavicon('<rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 9.5h19M6 14.5h4" />'),
  '/cancelaciones': buildFavicon('<path d="M9 5 4 10l5 5" /><path d="M4 10h9.5A5.5 5.5 0 0 1 19 15.5v0A5.5 5.5 0 0 1 13.5 21H8" />'),
  '/torneos': buildFavicon('<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7 10M17 5h3v1.5A3.5 3.5 0 0 1 17 10" /><path d="M12 13v4M9 21h6M9.5 21c0-2 1-3 2.5-3s2.5 1 2.5 3" />'),
  '/equipos': buildFavicon('<path d="M12 3 4.5 6v6c0 4.5 3 8 7.5 9 4.5-1 7.5-4.5 7.5-9V6L12 3Z" />'),
  '/partidos': buildFavicon('<circle cx="9" cy="12" r="6" /><path d="M15 12h4a2 2 0 0 0 2-2V8h-3M9 9v0M9 15v0" />'),
  '/notificaciones': buildFavicon('<path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" />'),
  '/reportes': buildFavicon('<rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" />'),
  '/estadisticas': buildFavicon('<path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2 20h20" />'),
  '/usuarios': buildFavicon('<circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" /><circle cx="18" cy="15" r="2" /><path d="M18 12.3v.7M18 17v.7M20.4 13.5l-.6.35M15.6 16.15l-.6.35M20.4 16.5l-.6-.35M15.6 13.85l-.6-.35" />'),
};

function resolveByPrefix<T>(map: Record<string, T>, pathname: string, fallback: T): T {
  if (map[pathname] !== undefined) return map[pathname];
  const prefixes = Object.keys(map).filter((p) => p !== '/').sort((a, b) => b.length - a.length);
  const match = prefixes.find((p) => pathname.startsWith(`${p}/`));
  return match ? map[match] : fallback;
}

export function applyPageMeta(pathname: string): void {
  const title = resolveByPrefix(pageTitles, pathname, APP_NAME);
  document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = resolveByPrefix(favicons, pathname, favicons['/']);
}
