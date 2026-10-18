import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { pushToast } from '$lib/stores/toast.svelte';

const target = document.getElementById('app');

if (target === null) {
  throw new Error('Elemen #app tidak ditemukan pada shell CodeIgniter.');
}

export default mount(App, { target });

// PWA: service worker hanya di build produksi (dev memakai HMR).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              pushToast('Versi baru tersedia — muat ulang halaman.', 'info');
            }
          });
        });
      })
      .catch(() => {
        // Offline cache tidak tersedia; aplikasi tetap berjalan online.
      });
  });
}
