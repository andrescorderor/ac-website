import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mocks': path.resolve(__dirname, 'src/mocks'),
      '@interfaces': path.resolve(__dirname, 'src/interfaces'),
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
