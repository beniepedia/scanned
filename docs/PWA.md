# PWA — ANPR SPBU

Status: **aktif** — service worker + cache app shell. Pembacaan plat memakai backend AI, jadi scan memerlukan jaringan; input manual tetap offline.
Dokumen ini mencatat keputusan, batasan, dan sisa pekerjaan.

## Sudah ada

| Item | Lokasi |
| --- | --- |
| Manifest | `public/manifest.webmanifest` (`name`/`short_name` "ANPR SPBU", `start_url` `/`, `scope` `/`, `display` standalone, `orientation` any, `theme_color` `#E01A22`) |
| Ikon | `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (sumber SVG: `icon.svg`, `icon-maskable.svg`) |
| Meta di shell | `app/Views/app.php`: manifest link, `apple-touch-icon`, `theme-color`, `apple-mobile-web-app-*` |
| MIME manifest | `public/.htaccess`: `AddType application/manifest+json .webmanifest` |

Service worker (`public/sw.js`, cache `anpr-spbu-v1`) sudah aktif pada build
produksi:

- Precache: `/`, `/manifest.webmanifest`, `/icons/*`.
- Runtime cache-first: `/app/*`, `/icons/*`.
- Shell HTML: network-first + fallback cache.
- `/api/*` dilewati (data tetap `localStorage` pada mode `local`).
- Registrasi di `main.ts` + toast "Versi baru tersedia — muat ulang".

Pembacaan plat memakai backend AI (`POST /ai/analyze-vehicle`), jadi scan butuh
jaringan. `/ai/*` sengaja tidak di-cache. Input manual tetap tersedia offline.

## Syarat penting

Service worker **hanya aktif pada secure context**. Jadi:

- `http://localhost` → SW jalan (dipakai saat pengembangan/uji).
- `https://spbu-svelte.test` → SW jalan **hanya bila sertifikat Laragon sudah
  dipercaya** perangkat. Sertifikat self-signed yang belum dipercaya memblokir
  registrasi SW ("An SSL certificate error occurred when fetching the script").
- `http://spbu-svelte.test` (atau IP LAN via http) → **tidak** secure context:
  kamera dan PWA tidak tersedia.

Cara mempercayai sertifikat: ekspor `C:/laragon/etc/ssl/laragon.crt` lalu install
sebagai Root CA di perangkat tablet, atau pakai `mkcert`.

## Hasil uji

- `navigator.serviceWorker.ready` → `activated`; cache `anpr-spbu-v1` berisi 8 entri
  termasuk `/app/assets/*`.
- Reload saat `context.setOffline(true)` → app tetap ter-mount.
- Scan dengan seluruh host eksternal diblokir → OCR membaca plat
  (`Terbaca E 1224 HEC …`) dan **0 permintaan eksternal**.

## Catatan dev server

Frontend memanggil backend AI same-origin lewat proxy `/ai/` (lihat
`docs/VHOST.md`). Tidak ada aset OCR yang perlu dilayani dev server.

## Sisa pekerjaan

1. Uji Lighthouse PWA di https dengan sertifikat tepercaya (install prompt).
2. Panduan "Install app" untuk Chrome Android/tablet di README.
3. Pertimbangkan strategi update cache saat deploy (bump `anpr-spbu-v1`).

## Catatan

- Kamera tetap butuh secure context (`https://spbu-svelte.test` atau
  `localhost`), termasuk saat aplikasi sudah ter-install.
- Cakupan cache dibatasi ke app shell + aset; data transaksi tidak di-cache
  karena berada di `localStorage` perangkat.
