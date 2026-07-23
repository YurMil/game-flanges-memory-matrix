import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    // Keep deploy artifact small for cadautoscript.com static push (no .map in mini-games/)
    sourcemap: false,
    assetsDir: 'assets',
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  },
});
