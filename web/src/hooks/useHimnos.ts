import { useState, useEffect } from 'react';

export interface SeccionLetra {
  t: 'e' | 'c' | 'p' | 'b' | 'n' | 's'; // e=estrofa, c=coro, p=pre-coro, b=puente, n=nota, s=titulo-seccion
  n?: number;                           // número de sección (opcional)
  lbl?: string;                         // etiqueta de voz (opcional, ej. "Hermanos:", "Todos:")
  l: string[];                          // líneas de la letra
}

export interface Himno {
  id: number;
  numero: string;
  nombre: string;
  letra: string;
  categoria: string;
  page: string;
  aud?: { src: string; id: string; lang: string }[];
  letra_estructurada?: SeccionLetra[];
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
