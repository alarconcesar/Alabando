import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'data/himnos.json',
        'img/*.jpg',
        'fonts/*.woff2',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json,ttf,woff2,jpg}'],
        globIgnores: ['partituras/**'],
        globDirectory: 'dist',
        navigateFallback: 'index.html',
        cacheId: 'himnario-eav',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/partituras\/.*\.png$|^\/partituras\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'partituras-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Los MIDI también deben quedar disponibles sin conexión:
            // sin esto la app abre offline pero el reproductor no tiene audio.
            urlPattern: /^https:\/\/.*\/midi\/.*\.mid$|^\/midi\/.*\.mid$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'midi-cache',
              expiration: {
                maxEntries: 800,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Himnario EAV',
        short_name: 'Himnario',
        description: 'Himnario PWA con soporte offline',
        theme_color: '#FCFAF6',
        background_color: '#FCFAF6',
        lang: 'es',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
