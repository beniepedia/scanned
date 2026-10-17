import type { Transaksi } from '$lib/types';
import { todayLocal, normalisePlat } from '$lib/utils/plate';

/** Contoh transaksi hari ini supaya metrik & riwayat tidak kosong saat demo. */
const ROWS: Omit<Transaksi, 'tanggal'>[] = [
  { id: 1, plat: 'B 1234 ABC', waktu: '07:15', bbm: 'Pertalite', liter: 3.5 },
  { id: 2, plat: 'B 5678 DEF', waktu: '07:42', bbm: 'Pertamax', liter: 4 },
  { id: 3, plat: 'D 901 GHI', waktu: '08:05', bbm: 'Pertalite', liter: 2 },
];

export const seedTransaksi: Transaksi[] = ROWS.map((t) => ({
  ...t,
  plat: normalisePlat(t.plat),
  tanggal: todayLocal(),
}));

export const SPBU = {
  nama: 'SPBU Pertamina 11.222.344',
  alamat: 'Jl. Sisingamangaraja',
};
