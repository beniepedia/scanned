import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Base & output bisa berbeda per target:
//  - CI4 (default): base '/app/', output ../public/app, entry src/main.ts
//  - Docker/static: VITE_BUILD_BASE=/, VITE_BUILD_OUTDIR=dist, VITE_BUILD_HTML=1
const buildBase = process.env.VITE_BUILD_BASE ?? '/app/';
const buildOutDir = process.env.VITE_BUILD_OUTDIR ?? '../public/app';
const buildHtml = process.env.VITE_BUILD_HTML === '1';

export default defineConfig({
  base: buildBase,
  plugins: [svelte(), tailwindcss()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Asset (font) di dev harus absolute ke origin Vite, bukan ke origin vhost CI4.
    origin: 'http://localhost:5173',
    // Shell SPA dimuat dari vhost CI4, jadi modul Vite harus boleh diakses lintas origin.
    cors: {
      origin: [
        'http://spbu-svelte.test',
        'https://spbu-svelte.test',
        'http://spbu-svelte.localhost',
        'http://localhost',
      ],
    },
    // Hit the SPA through http://spbu-svelte.test with VITE_DEV=1, or call the
    // API directly from the dev server through this proxy.
    proxy: {
      '/api': {
        target: 'http://spbu-svelte.test',
        changeOrigin: true,
      },
      // Backend AI (Express via proxy Apache /ai/). Tanpa ini, Vite menolak
      // request /ai/* karena base dev server adalah /app/.
      '/ai': {
        target: 'http://spbu-svelte.test',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: buildOutDir,
    emptyOutDir: true,
    manifest: true,
    sourcemap: false,
    rollupOptions: {
      input: buildHtml
        ? fileURLToPath(new URL('./index.html', import.meta.url))
        : fileURLToPath(new URL('./src/main.ts', import.meta.url)),
    },
  },
});
