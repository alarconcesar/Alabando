import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Already cached — use it
    if (cachedHimnos) {
      setHimnos(cachedHimnos);
      setLoading(false);
      return;
    }

    // Fetch in progress — wait for it
    if (currentFetch) {
      currentFetch.then(() => {
        if (cachedHimnos) setHimnos(cachedHimnos);
        setLoading(false);
      });
      return;
    }

    // Start new fetch
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
      .then(() => {
        if (cachedHimnos) setHimnos(cachedHimnos);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Subscribe to cache updates (in case parallel hooks resolve)
  useEffect(() => {
    const bump = () => {
      if (cachedHimnos) setHimnos(cachedHimnos);
      setLoading(!cachedHimnos);
    };
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);

  return { himnos, loading };
}
