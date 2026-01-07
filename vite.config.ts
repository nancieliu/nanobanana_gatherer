
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // We use a dynamic reference so that Vercel or AI Studio can provide the key at runtime
    // rather than baking in a potentially empty build-time variable.
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
