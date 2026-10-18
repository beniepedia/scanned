# Versi & verifikasi

Dicek langsung dari registry pada saat instalasi (bukan dari memori):

| Paket                          | Versi    | Sumber pengecekan                    |
| ------------------------------ | -------- | ------------------------------------ |
| PHP                            | 8.4.16   | `php -v`                             |
| Composer                       | 2.9.5    | `composer -V`                        |
| codeigniter4/appstarter        | 4.7.5    | `composer show codeigniter4/framework --all` |
| Node.js                        | 24.14.0  | `node -v`                            |
| npm                            | 11.9.0   | `npm -v`                             |
| svelte                         | 5.57.2   | `npm view svelte version` / lockfile |
| vite                           | 8.3.4    | `npm view vite version`              |
| @sveltejs/vite-plugin-svelte   | 7.3.1    | peer: `vite ^8`, `svelte ^5.46.4`    |
| tailwindcss + @tailwindcss/vite| 4.3.3    | `npm view tailwindcss version`       |
| typescript                     | 6.0.3    | lockfile                             |
| svelte-check                   | 4.7.7    | lockfile                             |
| eslint                         | 10.13.0  | `npm view eslint version` (peer-compatible dengan typescript-eslint 8 & eslint-plugin-svelte 3) |
| @fontsource-variable/inter     | 5.3.0    | lockfile                             |
| @fontsource-variable/jetbrains-mono | 5.3.0 | lockfile                            |

## PWA & aset statis

- `public/manifest.webmanifest` disajikan Apache sebagai
  `application/manifest+json` (lihat `public/.htaccess`).
- Ikon 192/512/maskable di `public/icons/` (sumber SVG ikut disimpan).
- Service worker `public/sw.js` (cache `anpr-spbu-v1`) aktif di build produksi.
- Pembacaan plat: backend `backend-node` (Express 5, multer 2, sharp 0.34,
  `@google/genai` 1.x, model `gemini-2.5-flash`) diakses via proxy `/ai/`.
- `.htaccess` menambah MIME `application/wasm` (.wasm), `application/x-gzip` (.gz),
  `application/manifest+json` (.webmanifest).

## Catatan kompatibilitas

- CI4 4.7 membutuhkan PHP ^8.2 + ext-intl + ext-mbstring.
- Vite 8 membutuhkan `@sveltejs/vite-plugin-svelte` 7.x (peer dependency).
- Tailwind 4 tidak lagi memakai `tailwind.config.js`; token ditulis di
  `src/app.css` melalui `@theme`.
- CI4 4.7 tidak lagi menyediakan `CodeIgniter\Validation\Traits\Validation`;
  validasi memakai `$this->validateData()` dari `CodeIgniter\Controller`.
- `CodeIgniter\Controller::validate()` membaca request mentah; untuk body JSON
  dipakai `validateData($payload, $rules)` agar hasilnya deterministik.

## Perintah verifikasi ulang

```bash
composer show codeigniter4/framework | head -3
npm view svelte version
npm view vite version
npm view @sveltejs/vite-plugin-svelte peerDependencies --json
npm view tailwindcss version
```

## Hasil pengujian terakhir

| Perintah                          | Hasil (17 Okt 2026)                                                     |
| --------------------------------- | ----------------------------------------------------------------------- |
| `vendor/bin/phpunit`              | 10 test, 21 assertion lulus (warning: tidak ada code coverage driver)   |
| `npm run check` (svelte-check)    | 0 error, 0 warning                                                      |
| `npm run lint` (ESLint 10)        | 0 error                                                                 |
| `npm run test` (node:test)        | 5 test lulus                                                            |
| `npm run build`                   | sukses (~0,5 s), `public/app/.vite/manifest.json` dibuat               |
| E2E (Playwright + Chrome, local)  | login → nozzle → beranda → scan → BBM → sukses → riwayat → hapus → reload → logout; 0 console error |
| E2E (mode `remote`)               | alur sama berjalan di atas API CI4, data persist di `writable/app/*.json` |
| Capture → backend AI (mock)        | sukses: dialog "Hasil Pembacaan" (plat dinormalisasi, warna, berlaku) → lanjut; 422/timeout: dialog Input Manual otomatis; payload ±12 KB |
| Kompresi gambar                   | 3000×2000 JPEG 1916 KB → **485 KB** (1600×1067, 1 percobaan) |
| Backend AI (nyata)                | `POST /ai/analyze-vehicle` via proxy (http & https) → respons Gemini diterima; plat sintetis tidak terbaca → 422 → manual (sesuai desain) |
| Responsif (360/390/768/1024/1440) | tidak ada horizontal overflow; rail nav tampil ≥768px; target sentuh ≥44px |
