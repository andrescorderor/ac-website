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
        icons: [
          {
            src: 'assets/ac-website-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'assets/ac-website-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/index.html',
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
  },
  server: {
    open: true,
  },
});
