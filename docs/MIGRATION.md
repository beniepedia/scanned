# Migrasi: Expo/React Native → CodeIgniter 4 + Svelte 5

## Sumber acuan

Aplikasi sumber **spbu-scan** (Expo, React Native 0.86 + Expo SDK 57);
produk hasil migrasi diberi nama **ANPR SPBU**. Sumber memakai
vision-camera + MLKit OCR. Karena sumbernya native, migrasi ini adalah **penulisan
ulang UI**, bukan port kode.

## Pemetaan layar

| Sumber (Expo)              | Implementasi web                          | Catatan |
| -------------------------- | ----------------------------------------- | ------- |
| `LoginScreen`              | `pages/Login.svelte`                      | + dialog pilih nozzle 01–04 |
| `HomeScreen`               | `pages/Beranda.svelte`                    | kartu SPBU & operator, 3 metrik, riwayat hari ini |
| `HistoryScreen`            | `pages/Riwayat.svelte`                    | + pencarian plat, filter BBM, hapus, pagination |
| `ScanScreen`               | `pages/Scan.svelte`                       | preview kamera → tombol Ambil Gambar → backend AI; fallback input manual |
| `BbmScreen`                | `pages/Bbm.svelte`                        | 3 BBM berwarna, numpad liter kustom + preset |
| Sukses (inline `App.tsx`)  | `pages/Sukses.svelte`                     | struk + total hari ini |
| Bottom bar + FAB scan      | `components/app/BottomNav.svelte`          | bottom bar (mobile), rail (tablet/desktop) |
| Dialog kendaraan baru      | `pages/Scan.svelte` (Dialog)              | validasi nama/jenis |
| Dialog "sudah isi hari ini"| `pages/Scan.svelte` (Dialog)              | opsi Batal / Lanjut (Pelangsir) |

## Komponen reusable

`Button`, `Input`, `Dialog` (native `<dialog>`, fokus terkurung + Esc), `Card`,
`Badge`, `Toast`, `Spinner`, `EmptyState`, `NumberPad`, `PlateKeypad`,
`AppShell`, `BottomNav`, `OperatorCard`, `MetricCard`, `TxRow`, `ScanOverlay`.

## Data dummy

- Operator: 21045/21046/21047, password `1234` (sumber: `src/db.ts` Expo).
- Motor: 10 kendaraan dari `src/data/motors.json` Expo.
- Transaksi: 3 contoh hari ini (`frontend/src/lib/data/seed.ts`) agar metrik tidak nol.
- Harga BBM tidak ditampilkan karena sumber tidak memilikinya (tidak menambah fitur).

## Util yang diport apa adanya

`normalisePlat`, `isPlatValid`, `extractPlatFromText`, `todayLocal`, `nowTime`
menjadi `frontend/src/lib/utils/plate.ts` + `formatPlat()`.
Test asli (`node:test`) dipertahankan di `plate.test.ts`; versi PHP ada di
`tests/unit/PlateTest.php`.

## Asumsi

1. Alur mengikuti aplikasi Expo (login → nozzle → beranda → scan → BBM → sukses → riwayat),
   bukan skema multi-tenant/dispenser dari `PLAN.md` versi Laravel.
2. Tidak ada database pada tahap ini; data dummy disimpan di perangkat, atau di
   `writable/app/*.json` bila mode `remote` diaktifkan.
3. Autentikasi hanya simulasi frontend + endpoint dummy; bukan otorisasi produksi.
4. "Pelangsir" = pengisian kedua dalam hari yang sama, tetap diizinkan dengan konfirmasi.
5. Kamera hanya tersedia pada secure context (HTTPS/localhost).

## Status

Selesai:
- 6 halaman + navigasi, guard sesi & flow, responsif mobile/tablet/desktop
- Simulasi interaksi: login, nozzle, kendaraan baru, blokir harian, catat, hapus,
  pencarian, filter, pagination, empty/loading/error state, toast, haptic
- API dummy CI4 dengan persistensi JSON, validasi server, unit test PHP & TS

Belum (tahap 2):
- Database + migration + model, transaksi atomik, soft delete
- Autentikasi/otorisasi produksi (session/token, role supervisor)
- penyimpanan hasil AI (warna/masa berlaku) ke backend & DB, riwayat multi-hari/filter tanggal
- PWA/offline, ekspor laporan, admin panel, multi-tenant (SPBU/dispenser/ml)

## Catatan pembacaan plat (AI)

- OCR lokal (tesseract.js) **dihapus** pada revisi ini: akurasi tidak memadai untuk
  plat Indonesia dan membebani tablet.
- Alur baru: preview kamera → tombol **Ambil Gambar** → `capture.ts` (ImageCapture
  atau canvas) → `compress.ts` (JPEG, sisi terpanjang 1600 px, ≤900 KB) →
  `api/vehicle.ts` mengirim `Blob` multipart (field `file`) ke
  `POST /ai/analyze-vehicle` (Express + Gemini 2.5 Flash via proxy Apache `/ai/`).
- Respons: `{success, message, data:{color, plate, year, month}}`. Frontend
  memvalidasi `plate` (pola RI) dan menormalkan warna/tahun/bulan; field selain
  plat bersifat opsional.
- Hasil ditampilkan di dialog "Hasil Pembacaan" (plat bisa dibetulkan 1-tap).
  Setelah "Lanjut", **dialog isian nama pelanggan dilewati**: plat yang belum
  terdaftar langsung didaftarkan otomatis (`nama: "Tanpa nama"`,
  `jenis: "Motor <warna>"`, plus warna/masa berlaku dari AI) lalu lanjut ke BBM.
  Dialog "sudah isi hari ini" tetap muncul bila plat sudah mengisi hari ini.
- `success:false`, error HTTP, timeout, atau jaringan putus → dialog **Input Manual**
  terbuka otomatis (plat terakhir dipakai sebagai prefill bila ada). Input manual
  tetap berfungsi offline.
- Foto dikirim keluar perangkat (Gemini cloud) → perhatikan privasi dan biaya API.

## Status

Selesai:
- 6 halaman + navigasi, guard sesi & flow, responsif mobile/tablet/desktop
- Simulasi interaksi: login, nozzle, kendaraan baru, blokir harian, catat, hapus,
  pencarian, filter, pagination, empty/loading/error state, toast, haptic
- API dummy CI4 dengan persistensi JSON, validasi server, unit test PHP & TS

Belum (tahap 2):
- Database + migration + model, transaksi atomik, soft delete
- Autentikasi/otorisasi produksi (session/token, role supervisor)
- penyimpanan hasil AI (warna/masa berlaku) ke backend & DB, riwayat multi-hari/filter tanggal
- PWA/offline, ekspor laporan, admin panel, multi-tenant (SPBU/dispenser/ml)
