# Arsitektur

## Peran tiap sisi

CodeIgniter 4 dan Svelte berbagi satu origin (`http://spbu-svelte.test`):

- **CodeIgniter** — entry point, shell HTML (`app/Views/app.php`), dan API JSON
  di `/api/v1/*`. Tidak melakukan rendering UI.
- **Svelte** — seluruh UI, navigasi (hash router), state antarmuka, validasi
  formulir, dan pemanggilan API. Build statis diletakkan di `public/app/`.
- **Jembatan** — `app/Helpers/vite_helper.php` membaca
  `public/app/.vite/manifest.json` dan menyuntikkan `<link>`/`<script>` ke shell.
  Mode dev memakai Vite dev server (`VITE_DEV=1`).

Tidak ada dua implementasi UI: satu aplikasi Svelte, satu shell CI4.

## Alur request

```
Browser
  GET /                     -> CI4 Home::index -> app/Views/app.php -> bundle Svelte
  GET /app/assets/*.js|css  -> file statis di public/app (Apache, tanpa CI4)
  GET /api/v1/...           -> CI4 Api\V1\*Controller -> Service -> JsonStore
```

## Struktur direktori

```
app/
  Config/Routes.php            route shell + grup api/v1
  Controllers/Home.php         menyajikan shell SPA
  Controllers/Api/V1/
    BaseApiController.php      envelope JSON {success,data,meta}
    OperatorController.php     list operator + login
    MotorController.php        list/cari/tambah motor
    TransaksiController.php    list (filter), tambah, hapus
  Libraries/Plate.php          normalisasi + validasi + ekstraksi plat (mirror TS)
  Services/
    JsonStore.php              store JSON dengan file lock
    OperatorService.php        data operator dummy
    MotorService.php           data motor (seed 10 kendaraan)
    TransaksiService.php       transaksi + aturan "sudah isi hari ini"
  Views/app.php                shell SPA
  Helpers/vite_helper.php      manifest loader (prod) / dev server (dev)

frontend/src/
  main.ts                      mount Svelte
  App.svelte                   pemilihan halaman + guard sesi/flow
  pages/                       Login, Beranda, Scan, Bbm, Sukses, Riwayat
  lib/
    api/                       client.ts (fetch wrapper) + endpoints.ts
    components/ui/             Button, Input, Dialog, Card, Badge, Toast, Spinner,
                               EmptyState, NumberPad
    components/app/            AppShell, BottomNav, OperatorCard, MetricCard, TxRow,
                               PlateKeypad, ScanOverlay
    data/                      seed data (operators, motors, fuels, seed transaksi)
    camera/capture.ts          preview kamera + ambil still (Blob)
    camera/compress.ts         kompresi JPEG <=900 KB (canvas)
    api/vehicle.ts             upload Blob ke backend AI + normalisasi hasil
    repo/                      kontrak DataRepo + implementasi local & remote
    stores/                    session, transaksi, flow, toast (runes)
    utils/                     plate.ts (+ test), format.ts
    router.svelte.ts           hash router
    types.ts
```

## State & data

- **Session** (`stores/session.svelte.ts`) — operator + nozzle + jam masuk,
  persist di `localStorage` (`spbu:session`).
- **Transaksi** (`stores/transaksi.svelte.ts`) — daftar transaksi, tambah, hapus,
  `hariIni()`, `sudahIsiHariIni()`, `ringkasanHariIni()`.
- **Flow** (`stores/flow.svelte.ts`) — plat/motor yang sedang diproses dan
  transaksi terakhir untuk halaman sukses.
- **Repo** (`lib/repo/`) — satu kontrak `DataRepo`, dua implementasi:

| Mode     | Aktif bila                   | Penyimpanan                                  |
| -------- | ---------------------------- | -------------------------------------------- |
| `local`  | default                      | seed TS + `localStorage` (`spbu:motors`, `spbu:transaksi`) |
| `remote` | `VITE_DATA_SOURCE=remote`    | API `/api/v1` → `writable/app/*.json`         |

Halaman **hanya** memanggil `repo.*` dan store — tidak pernah `fetch` langsung,
jadi penggantian backend tidak menyentuh komponen.

## Endpoint API (v1)

| Method | Path                  | Body                          | Keterangan                     |
| ------ | --------------------- | ----------------------------- | ------------------------------ |
| GET    | `/api/v1/operators`   | –                             | daftar operator (tanpa password) |
| POST   | `/api/v1/operators/login` | `{nomor, password}`       | autentikasi dummy              |
| GET    | `/api/v1/motors?q=`   | –                             | daftar/cari kendaraan          |
| GET    | `/api/v1/motors/{plat}` | –                           | detail kendaraan (404 jika belum ada) |
| POST   | `/api/v1/motors`      | `{nama, jenis, plat}`         | tambah kendaraan               |
| GET    | `/api/v1/transaksi?tanggal=YYYY-MM-DD&plat=` | – | riwayat + meta `{total, liter, tanggal}` |
| POST   | `/api/v1/transaksi`   | `{plat, bbm, liter}`          | catat transaksi                |
| DELETE | `/api/v1/transaksi/{id}` | –                          | hapus transaksi                |

Envelope sukses: `{"success":true,"data":...,"meta":{}}`.
Envelope gagal: `{"success":false,"message":"...","errors":{}}` dengan status
400/401/404/422. Validasi dilakukan di controller (`validateData`) memakai data JSON.

## Ganti dummy ke database (tahap 2)

1. Buat migration + model (`php spark make:migration`, `make:model`).
2. Ganti isi `MotorService`, `TransaksiService`, `OperatorService` agar memakai model.
   Controller, route, dan frontend tidak perlu berubah.
3. Hapus `JsonStore` dan isi `writable/app/`, lalu baru aktifkan
   `VITE_DATA_SOURCE=remote` di frontend.

## Penamaan

- Nama produk: **ANPR SPBU** (Automatic Number Plate Recognition SPBU).
- Yang dipertahankan agar konfigurasi tidak putus: folder `spbu-svelte`, vhost
  `spbu-svelte.test`, namespace PHP `App\`, dan nama paket composer.
- PWA: `public/manifest.webmanifest` ("ANPR SPBU"), ikon `public/icons/`, dan
  service worker `public/sw.js` (cache `anpr-spbu-v1`) aktif pada build produksi.
  Detail: `docs/PWA.md`.
- `SPBU Pertamina 11.222.344` di kartu operator adalah data SPBU (tenant), bukan
  nama aplikasi.

## Auto Scan (pemicu lokal)

- Detektor: **heuristik** di `src/lib/vision/plate-detector.ts` — frame diturunkan ke
  384 px, grayscale, Otsu, connected components, filter rasio aspek 2:1–6:1,
  luas 0,5%–40%, white-ratio ≥35%, kontras ≥55, margin tepi. Tanpa model YOLO,
  tanpa dataset, tanpa OCR lokal.
- Stabilitas: `src/lib/vision/auto-trigger.ts` menuntut kandidat stabil
  `VITE_AUTO_SCAN_STABLE_FRAMES` (default 3) dengan drift pusat ≤5% sebelum capture.
- Ketajaman: `frameSharpness()` (varians Laplacian) menolak frame blur (<40).
- Kirim **frame penuh** (bukan crop) agar backend juga membaca warna kendaraan.
- Guard: cooldown `VITE_AUTO_SCAN_COOLDOWN_MS` (10 s), maks upload
  `VITE_AUTO_SCAN_MAX_UPLOADS` (3) per aktivasi, berhenti setelah 1 sukses,
  berhenti saat tab hidden / dialog terbuka / kamera pause.
- Entry point: tombol **Auto Scan** di Beranda (mode manual tetap tersedia) dan
  switch di layar scan. Preferensi disimpan di `localStorage` (`spbu:scanMode`).
- `VITE_VISION_STUB=1` mengganti detektor dengan kandidat tetap untuk uji otomatis.

## Aset & jaringan

- Tidak ada aset dari CDN: font (`@fontsource`), manifest/ikon semuanya same-origin.
- Service worker: network-first untuk shell, cache-first untuk aset, skip `/api/*` dan `/ai/*`.
- Pembacaan plat memakai backend AI eksternal: `POST /ai/analyze-vehicle`
  (Express + Gemini) yang diproksikan Apache ke `127.0.0.1:8000`, same-origin.
  Gambar dikirim sebagai `Blob` multipart (field `file`) setelah dikompres
  ≤900 KB; bila backend menjawab `success:false`/error/timeout, UI membuka
  dialog input manual.
- Skeleton (`ui/Skeleton.svelte`) untuk loading, toast global untuk error tak
  tertangkap (`<svelte:window onerror / onunhandledrejection>`).

## Catatan teknis

- Debug toolbar CI4 dimatikan (`app/Config/Filters.php`) karena menyuntikkan HTML
  ke shell SPA. Aktifkan kembali bila perlu debugging HTML.
- `Plate.php` (PHP) dan `plate.ts` (TS) harus tetap sinkron; keduanya punya test.
- Hash router dipilih agar tidak perlu rewrite rule tambahan. Untuk nested route
  atau parameter path, ganti dengan `svelte-routing`.
