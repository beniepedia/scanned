import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Build output is served by CodeIgniter from public/app/.
// `base` must match the route that maps to that folder (see app/Config/Routes.php
// and the /app rewrite in public/.htaccess).
export default defineConfig({
  base: '/app/',
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
    },
  },
  build: {
    outDir: '../public/app',
    emptyOutDir: true,
    manifest: true,
    sourcemap: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
    },
  },
});
