
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This tells Vite to leave 'process.env.API_KEY' as a literal code reference
    // so the environment (AI Studio or Vercel) can inject it at runtime.
    'process.env.API_KEY': 'process.env.API_KEY',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
