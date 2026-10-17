# SPBU Scan — CodeIgniter 4 + Svelte 5

Aplikasi pencatatan pengisian BBM motor untuk operator SPBU. Migrasi dari aplikasi
Expo/React Native (`spbu-scan` lama) ke **CodeIgniter 4 (API + shell)** dan
**Svelte 5 + Vite + Tailwind CSS 4** (UI).

Tahap 1 fokus pada **UI/UX mobile & tablet** dengan dummy data. Belum ada database,
autentikasi produksi, maupun business logic backend yang kompleks.

## Stack

| Bagian  | Teknologi                                        |
| ------- | ------------------------------------------------ |
| Backend | PHP 8.4.16, CodeIgniter 4.7.5                    |
| Frontend| Svelte 5.57.2 (runes), Vite 8.3.4, TypeScript 6  |
| Styling | Tailwind CSS 4.3.3 (CSS-first `@theme`)          |
| OCR     | tesseract.js 7.0.0 (berjalan di browser)          |
| Font    | Inter Variable + JetBrains Mono Variable          |

Versi lengkap & hasil verifikasi: [`docs/TECH.md`](docs/TECH.md).

## Struktur singkat

```
app/                 CodeIgniter 4 (controller, service, library, view shell)
  Controllers/Api/V1 API JSON (dummy, tanpa database)
  Views/app.php      Shell SPA (memuat bundle Vite)
frontend/            Aplikasi Svelte (Vite root)
  src/pages/         Halaman: login, beranda, scan, bbm, sukses, riwayat
  src/lib/           komponen, store, repo data, OCR, util
docs/                Arsitektur, migrasi, vhost, versi
public/app/          Hasil build frontend (dibuat oleh `npm run build`)
```

## Prasyarat

- PHP 8.2+ (diuji pada 8.4.16) dengan ekstensi `intl`, `mbstring`
- Composer 2
- Node.js 20+ (diuji pada 24) & npm
- Web server dengan document root diarahkan ke `public/` (contoh: Laragon)
- Untuk fitur kamera: **HTTPS** (`https://spbu-svelte.test`) atau `localhost`.
  Browser memblokir `getUserMedia` pada origin HTTP biasa.

## Instalasi

```bash
cd "D:\WEB APP\www\spbu-svelte"

composer install
cp env .env          # lalu isi app.baseURL = 'http://spbu-svelte.test/'
php spark key:generate

cd frontend
npm install
npm run build        # menghasilkan public/app/.vite/manifest.json
```

Konfigurasi vhost (Laragon): lihat [`docs/VHOST.md`](docs/VHOST.md).
Document root **harus** `D:\WEB APP\www\spbu-svelte\public`.

## Menjalankan

Dua mode, pilih salah satu:

**A. Build + web server (menyerupai produksi)**

```bash
cd frontend && npm run build
# buka http://spbu-svelte.test
```

**B. Development dengan HMR**

```bash
# 1) aktifkan mode dev di .env
VITE_DEV = 1

# 2) jalankan Vite
cd frontend && npm run dev

# 3) buka http://spbu-svelte.test
```

Shell CodeIgniter akan memuat `http://localhost:5173/@vite/client` + entry Svelte.
Kembalikan `VITE_DEV = 0` setelah selesai. Alternatif tanpa mengubah `.env`:
`php spark serve --port 8080` lalu sesuaikan `app.baseURL` sementara.

## Kredensial demo

| No. operator | Password | Nama  |
| ------------ | -------- | ----- |
| 21045        | 1234     | Andi  |
| 21046        | 1234     | Budi  |
| 21047        | 1234     | Citra |

Setelah login, pilih nozzle 01–04. Data motor awal: `frontend/src/lib/data/motors.ts`
(10 kendaraan). Plat contoh: `B 1234 ABC`, `B 5678 DEF`, `D 901 GHI`.

## Sumber data

Default: **local** — dummy data + `localStorage` (tidak butuh backend).

Switch ke API CodeIgniter:

```bash
cd frontend
echo "VITE_DATA_SOURCE=remote" > .env.local
npm run build
```

API dummy menyimpan data ke `writable/app/*.json` (bukan database), sehingga
`tambah motor`, `catat transaksi`, dan `hapus transaksi` benar-benar persist antar
request. Endpoint: lihat [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Perintah

```bash
# Backend
php spark serve                 # dev server PHP (port 8080)
php spark routes                # daftar route
vendor/bin/phpunit              # test PHP (PlateTest, HealthTest, ...)

# Frontend (dari folder frontend/)
npm run dev                     # Vite dev server + HMR
npm run build                   # build ke ../public/app
npm run check                   # svelte-check + TypeScript
npm run lint                    # ESLint (flat config)
npm run test                    # node:test untuk util plat
```

## Fitur yang berfungsi

- Login operator + pemilihan nozzle (sesi disimpan di perangkat)
- Beranda: kartu SPBU/operator, 3 metrik, riwayat hari ini, empty/loading/error state
- Scan plat: kamera `getUserMedia`, overlay + animasi scan, OCR tesseract.js,
  fallback input manual + keypad plat, dialog kendaraan baru, dialog "sudah isi hari ini"
- Input BBM: 3 jenis BBM berwarna, numpad liter kustom, preset, validasi 0–100
- Halaman sukses + struk
- Riwayat: pencarian plat, filter BBM, hapus dengan konfirmasi, pagination 10/halaman
- Responsif: bottom nav + FAB (mobile), rail nav (tablet/desktop), tanpa horizontal scroll

Detail status dan batasan: [`docs/MIGRATION.md`](docs/MIGRATION.md).
