// ── Storage Keys ─────────────────────────────────────────
export const STORAGE_KEYS = {
  FAVORITES: 'favorites',
  HISTORY: 'history',
  THEME: 'theme',
  FONT_SIZE: 'fontSize',
  PWA_INSTALLED: 'pwa-installed',
  PWA_DISMISS_COUNT: 'pwa-dismiss-count',
} as const;

// ── App Limits ───────────────────────────────────────────
export const MAX_HISTORY = 50;
export const MAX_SEARCH_RESULTS = 100;
export const DEFAULT_FONT_SIZE = 19;
export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 30;
export const NAV_HIDE_THRESHOLD = 768; // px
export const MAX_PWA_DISMISSALS = 3;

// ── Routing ──────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  ALBUMES: '/albumes',
  FAVORITOS: '/favoritos',
  NUEVOS: '/nuevos',
  ALL_HYMNS: '/all-hymns',
  HISTORY: '/history',
  HYMN_DETAIL: '/himno/:id',
  SETTINGS: '/settings',
} as const;

// ── Theme ─────────────────────────────────────────────────
export const THEME_OPTIONS = ['naranja', 'dark'] as const;
export type Theme = (typeof THEME_OPTIONS)[number];

export type ThemeMode = Theme | 'system';

export function isTheme(value: string): value is Theme {
  return THEME_OPTIONS.includes(value as Theme);
}
