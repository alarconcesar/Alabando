import { STORAGE_KEYS, DEFAULT_FONT_SIZE, FONT_SIZE_MIN, FONT_SIZE_MAX } from './constants';

/** Safe localStorage helpers with validation */

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write localStorage key "${key}":`, e);
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // silent
  }
}

export function getStoredFontSize(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (raw === null) return DEFAULT_FONT_SIZE;
    const size = Number(raw);
    if (!Number.isFinite(size)) return DEFAULT_FONT_SIZE;
    return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size));
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}
