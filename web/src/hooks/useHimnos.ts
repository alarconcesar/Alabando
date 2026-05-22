import { useState, useEffect } from 'react';

export interface Himno {
  id: number;
  numero: string;
  nombre: string;
  letra: string;
  categoria: string;
  page: string;
  aud?: { src: string; id: string; lang: string }[];
}

export function useHimnos() {
  const [himnos, setHimnos] = useState<Himno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/himnos.json')
      .then(res => res.json())
      .then(data => {
        setHimnos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching himnos:', err);
        setLoading(false);
      });
  }, []);

  return { himnos, loading };
}
