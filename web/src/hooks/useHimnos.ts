import { useState, useEffect, useCallback } from 'react';
import type { Himno } from '../types.d';

// ── Module-level cache singleton ─────────────────────────
let cachedHimnos: Himno[] | null = null;
let currentFetch: Promise<Himno[]> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function getCachedHimnos(): Himno[] | null {
  return cachedHimnos;
}

export function useHimnos() {
  const [himnos, setHimnos] = useState<Himno[]>(cachedHimnos ?? []);
  const [loading, setLoading] = useState(!cachedHimnos);
  const [error, setError] = useState<Error | null>(null);

  const fetchHimnos = useCallback(() => {
    if (cachedHimnos) {
      setHimnos(cachedHimnos);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    if (currentFetch) {
      currentFetch
        .then((data) => {
          setHimnos(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });
      return;
    }

    currentFetch = fetch('/data/himnos.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Himno[]>;
      })
      .then((data) => {
        cachedHimnos = data;
        currentFetch = null;
        notifyListeners();
        return data;
      })
      .catch((err) => {
        currentFetch = null;
        console.error('Error fetching himnos:', err);
        throw err;
      });

    currentFetch
      .then((data) => {
        setHimnos(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Si el cache ya está lleno el estado inicial ya lo refleja; solo
    // hace falta fetch cuando no hay datos
    if (!cachedHimnos) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch con caché en módulo: el setState síncrono solo ocurre en el camino cacheado
      fetchHimnos();
    }
  }, [fetchHimnos]);

  // Subscribe to cache updates (in case parallel hooks resolve)
  useEffect(() => {
    const bump = () => {
      if (cachedHimnos) {
        setHimnos(cachedHimnos);
        setError(null);
      }
      setLoading(!cachedHimnos);
    };
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  return { himnos, loading, error, retry: fetchHimnos };
}
