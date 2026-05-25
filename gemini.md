# Proyecto Alabando

Himnario digital multiplataforma que permite la visualización de himnos, partituras y contenido multimedia relacionado. El proyecto ha migrado de una base nativa Android a una aplicación web progresiva (PWA).

## Estructura del Proyecto

- `web/`: Aplicación principal (React + TypeScript + Vite).
- `original/`: Proyecto original de Android (fuente de recursos y lógica legacy).
- `extract_pdf.py`: Script de automatización que convierte el PDF de partituras (`original/.../Partituras.pdf`) en imágenes PNG optimizadas para la web.
- `web/standardize_himnos.py`: Script crítico que procesa `himnos.json` para generar `letra_estructurada`, permitiendo una renderización precisa de estrofas, coros y notas en la UI.

## Stack Tecnológico (Web)

- **Core**: React 19, TypeScript.
- **Build Tool**: Vite.
- **Routing**: React Router 7.
- **PWA**: `vite-plugin-pwa` para soporte offline e instalación.
- **Icons**: Lucide React.
- **Estilos**: Vanilla CSS con un sistema de diseño personalizado (Glassmorphism, Dark Mode).

## Flujo de Datos y Preparación

1. **Partituras**: El script `extract_pdf.py` genera imágenes en `web/public/partituras/`.
2. **Himnos**: El archivo `web/public/data/himnos.json` es el "Single Source of Truth".
3. **Normalización**: `standardize_himnos.py` analiza las letras planas y las convierte en objetos estructurados (tipos: `e` estrofa, `c` coro, `s` sección, `n` nota).

## Componentes Principales

- `Home.tsx`: Dashboard con acceso rápido y categorías.
- `HymnDetail.tsx`: Visualizador avanzado con soporte para letras estructuradas, modo partitura (imágenes) y reproductor de YouTube.
- `Search.tsx`: Buscador global por número, nombre o contenido.
- `standardize_himnos.py`: Contiene parsers personalizados para himnos complejos (ej. Himno 96).

## Notas de Desarrollo

- Las partituras se identifican por el campo `page` en el JSON, vinculándose con `page_{n}.png`.
- La aplicación está preparada para despliegue en Vercel (`vercel.json`).
