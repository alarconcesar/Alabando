/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
declare module 'lucide-react';

export interface SeccionLetra {
  t: 'e' | 'c' | 'p' | 'b' | 'n' | 's';
  n?: number;
  lbl?: string;
  l: string[];
}

export interface AudioSource {
  src: string;
  id: string;
  lang: string;
}

export interface Himno {
  id: number;
  numero: string;
  nombre: string;
  letra: string;
  categoria: string;
  page: string;
  info: string;
  aud?: AudioSource[];
  letra_estructurada?: SeccionLetra[];
}

export interface HistoryItem {
  id: number;
  nombre: string;
  numero: string;
  timestamp: number;
}
