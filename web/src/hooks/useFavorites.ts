import { useState, useEffect, useCallback } from 'react';
import { getJSON, setJSON } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';

export function useFavorites() {
  const [favorites, setFavorites] = useState<number[]>(() =>
    getJSON<number[]>(STORAGE_KEYS.FAVORITES, []),
  );

  // Sync from storage (for cross-tab or manual changes)
  useEffect(() => {
    const handler = () => {
      setFavorites(getJSON<number[]>(STORAGE_KEYS.FAVORITES, []));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id];
      setJSON(STORAGE_KEYS.FAVORITES, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.includes(id),
    [favorites],
  );

  const refresh = useCallback(() => {
    setFavorites(getJSON<number[]>(STORAGE_KEYS.FAVORITES, []));
  }, []);

  return { favorites, toggleFavorite, isFavorite, refresh } as const;
}
