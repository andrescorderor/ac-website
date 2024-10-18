import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
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
