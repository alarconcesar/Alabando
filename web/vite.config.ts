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
        'fonts/*.ttf',
        'img/*.jpg',
        'favicon.svg',
        'icons.svg',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/partituras\/.*\.png$|^\/partituras\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'partituras-cache',
              expiration: {
                maxEntries: 100,
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
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
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
