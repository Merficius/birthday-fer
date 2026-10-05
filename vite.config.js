import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets load relatively on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
