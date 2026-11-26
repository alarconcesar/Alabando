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

// ── Album Card Gradients ──────────────────────────────────
// Gama cálida derivada de la paleta (terracota, arcilla, ámbar, oliva, tuétano).
// Se usan como tinte al 6%, así que la variación debe quedarse en tierras.
export const ALBUM_GRADIENTS: string[] = [
  'linear-gradient(135deg, #C2410C, #E8895A)',
  'linear-gradient(135deg, #9A3412, #D9A87A)',
  'linear-gradient(135deg, #6B7A3A, #A8B77A)',
  'linear-gradient(135deg, #B45309, #E9B267)',
  'linear-gradient(135deg, #7C2D12, #C99A6B)',
  'linear-gradient(135deg, #A16207, #DEC37A)',
  'linear-gradient(135deg, #4D7C0F, #A3C46A)',
  'linear-gradient(135deg, #78350F, #B98A5A)',
  'linear-gradient(135deg, #B8451B, #EEB08A)',
  'linear-gradient(135deg, #7C3A4D, #C79BA6)',
  'linear-gradient(135deg, #6A635E, #C9BEB1)',
  'linear-gradient(135deg, #92400E, #D6A96B)',
];

/** Deterministically picks a gradient for a category name */
export function getAlbumGradient(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ALBUM_GRADIENTS[Math.abs(hash) % ALBUM_GRADIENTS.length];
}

/** Extracts the first hex color from a gradient string */
function extractFirstColor(gradient: string): string {
  const match = gradient.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : '#C2410C';
}

/** Converts hex color to rgba with given opacity */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Returns a tinted background color (very low opacity) from a gradient */
export function getAlbumTint(gradient: string): string {
  return hexToRgba(extractFirstColor(gradient), 0.06);
}
