import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': 'http://localhost:4000',
      '/qrcodes': 'http://localhost:4000',
    },
  },
});
