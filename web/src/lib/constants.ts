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
export const ALBUM_GRADIENTS: string[] = [
  'linear-gradient(135deg, #FC7124, #FF9A5C)',
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #f83600, #f9d423)',
  'linear-gradient(135deg, #0fd850, #0cbaba)',
  'linear-gradient(135deg, #e65c00, #F9D423)',
  'linear-gradient(135deg, #2b5876, #4e4376)',
  'linear-gradient(135deg, #e8198b, #c7eafd)',
];

/** Deterministically picks a gradient for a category name */
export function getAlbumGradient(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ALBUM_GRADIENTS[Math.abs(hash) % ALBUM_GRADIENTS.length];
}
