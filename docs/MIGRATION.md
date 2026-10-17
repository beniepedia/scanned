# Migrasi: Expo/React Native → CodeIgniter 4 + Svelte 5

## Sumber acuan

Aplikasi **SPBU Scan** versi Expo (React Native 0.86 + Expo SDK 57), dengan
vision-camera + MLKit OCR. Karena sumbernya native, migrasi ini adalah **penulisan
ulang UI**, bukan port kode.

## Pemetaan layar

| Sumber (Expo)              | Implementasi web                          | Catatan |
| -------------------------- | ----------------------------------------- | ------- |
| `LoginScreen`              | `pages/Login.svelte`                      | + dialog pilih nozzle 01–04 |
| `HomeScreen`               | `pages/Beranda.svelte`                    | kartu SPBU & operator, 3 metrik, riwayat hari ini |
| `HistoryScreen`            | `pages/Riwayat.svelte`                    | + pencarian plat, filter BBM, hapus, pagination |
| `ScanScreen`               | `pages/Scan.svelte`                       | kamera web + OCR tesseract.js, input manual + keypad |
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
- OCR browser (tesseract.js) dengan preprocessing crop + grayscale + threshold
- Simulasi interaksi: login, nozzle, kendaraan baru, blokir harian, catat, hapus,
  pencarian, filter, pagination, empty/loading/error state, toast, haptic
- API dummy CI4 dengan persistensi JSON, validasi server, unit test PHP & TS

Belum (tahap 2):
- Database + migration + model, transaksi atomik, soft delete
- Autentikasi/otorisasi produksi (session/token, role supervisor)
- OCR sisi server, koreksi plat 1-tap, riwayat multi-hari/filter tanggal
- PWA/offline, ekspor laporan, admin panel, multi-tenant (SPBU/dispenser/ml)

## Catatan OCR

- Engine: `tesseract.js` (worker `eng`, whitelist A–Z0–9). Model bahasa diunduh
  dari CDN saat pertama kali (±15 MB) lalu di-cache browser → **butuh internet
  pada pemakaian pertama**; untuk operasi offline perlu hosting `traineddata` lokal.
- Akurasi bergantung kualitas foto. Uji internal: gambar plat bersih "B 1234 ABC"
  terbaca `B1234ABC`. Foto miring/buram/kontras rendah sering gagal.
- Karena itu input manual + keypad selalu tersedia, loop berhenti setelah 4 percobaan
  atau 12 detik lalu membuka dialog manual.
- Kamera palsu (fake device) hanya menghasilkan noise, diuji: OCR jalan, tidak
  menemukan plat, fallback manual muncul (sesuai desain).
