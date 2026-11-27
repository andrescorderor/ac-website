import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Andrés Cordero - Panel Personal',
        short_name: 'PanelPersonal',
        description: 'Strategic Dashboard & Personal Productivity Hub',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/admin/panel',
        icons: [
          {
            src: 'assets/ac-website-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'assets/ac-website-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'assets/ac-website-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
        shortcuts: [
          {
            name: 'Nueva Tarea',
            short_name: 'Tarea',
            description: 'Crear una nueva tarea pendiente',
            url: '/admin/panel/pendientes?new=1',
            icons: [{ src: 'assets/ac-website-icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Modo Súper',
            short_name: 'Súper',
            description: 'Abrir listado semanal de mandado',
            url: '/admin/panel/compras?mandado=true',
            icons: [{ src: 'assets/ac-website-icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Registrar Gasto',
            short_name: 'Gasto',
            description: 'Agregar gasto rápido en Finanzas',
            url: '/admin/panel/finanzas?new=1',
            icons: [{ src: 'assets/ac-website-icon-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Calendario 360°',
            short_name: 'Calendario',
            description: 'Ver agenda unificada de todo el panel',
            url: '/admin/panel/calendario',
            icons: [{ src: 'assets/ac-website-icon-192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/, /^\/llms\.txt$/],
        importScripts: ['/sw-push.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@mocks': '/src/mocks',
      '@interfaces': '/src/interfaces',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@assets': '/public/assets',
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': [
            'react-icons/hi',
            'react-icons/fa',
            'react-icons/io',
            'react-icons/io5',
            'react-icons/md',
            'react-icons/gr',
          ],
        },
      },
    },
  },
  server: {
    open: true,
  },
});
