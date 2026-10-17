# AGENTS.md — SPBU Scan (CodeIgniter 4 + Svelte 5)

Panduan untuk agen/AI yang bekerja di repo ini.

## Stack & aturan versi

- Backend: CodeIgniter 4.7.x di PHP 8.4 (`app/`, `public/`, `writable/`).
- Frontend: Svelte 5 (runes) + Vite 8 + Tailwind 4 + TypeScript, root di `frontend/`.
- Verifikasi versi dengan registry sebelum menambah dependency:
  `composer show <pkg> --all`, `npm view <pkg> version`.
- Jangan menambah dependency untuk hal yang bisa diselesaikan stdlib/browser API.
- Tidak ada database pada tahap ini. Data dummy: `frontend/src/lib/data/` (mode
  `local`) atau `writable/app/*.json` (mode `remote`).

## Struktur wajib dipatuhi

- Halaman Svelte: `frontend/src/pages/` — satu file per layar, tanpa logika data langsung.
- Komponen UI generik: `frontend/src/lib/components/ui/`.
- Komponen khas aplikasi: `frontend/src/lib/components/app/`.
- Akses data **hanya** lewat `frontend/src/lib/repo/` (kontrak `DataRepo`) dan store
  runes di `frontend/src/lib/stores/`. Jangan `fetch` langsung dari komponen.
- Backend: controller tipis → `app/Services/*` → `app/Libraries/*`. Route di
  `app/Config/Routes.php`. Respons memakai `BaseApiController` envelope
  `{success, data, meta}`.
- Normalisasi plat ada di dua tempat dan **harus sinkron**:
  `app/Libraries/Plate.php` dan `frontend/src/lib/utils/plate.ts`.

## Perintah

```bash
# Backend
php spark serve
php spark routes
vendor/bin/phpunit
for f in $(git ls-files 'app/**.php'); do php -l "$f"; done

# Frontend
cd frontend
npm run check     # svelte-check + TS (wajib 0 error)
npm run lint      # ESLint
npm run test      # node:test util plat
npm run build     # hasil ke ../public/app
```

Definition of done: `npm run check`, `npm run lint`, `npm run test`, `npm run build`
hijau, plus `vendor/bin/phpunit` hijau, dan alur UI diuji di http://spbu-svelte.test.

## Konvensi kode

- Svelte 5: `$state`, `$derived`, `$effect`, `$props()`, `$bindable()`, atribut
  event `onclick`/`oninput`, snippet `{@render children()}`.
- TypeScript strict, tanpa `any`; tipe domain di `frontend/src/lib/types.ts`.
- Warna/radius/font hanya dari token `@theme` di `frontend/src/app.css`
  (palet Pertamina). Jangan hardcode hex di komponen.
- Mobile-first: ukuran sentuh minimum 44px, tanpa horizontal overflow,
  bottom nav di mobile dan rail nav mulai breakpoint `md`.
- Semua aksi harus berfungsi (tidak ada tombol dekoratif). State loading/empty/
  error/disabled wajib ada untuk data async.
- Komentar kode berbahasa Indonesia atau Inggris, singkat, menjelaskan "kenapa".

## Jangan

- Jangan membuat entry point atau build kedua untuk UI yang sama.
- Jangan mengklaim data tersimpan ke database; sebut "data lokal/perangkat".
- Jangan commit `public/app/`, `.env`, `frontend/node_modules/`, `writable/app/`.
- Jangan mengubah `public/index.php` atau menambah rewrite rule tanpa memperbarui
  `docs/VHOST.md`.

## Dokumentasi terkait

- `README.md` — instalasi & cara menjalankan
- `docs/ARCHITECTURE.md` — struktur, alur data, endpoint, rencana ganti ke DB
- `docs/MIGRATION.md` — audit sumber Expo, pemetaan layar, asumsi, status
- `docs/VHOST.md` — konfigurasi Laragon/Apache, HTTPS untuk kamera
- `docs/TECH.md` — versi terverifikasi
