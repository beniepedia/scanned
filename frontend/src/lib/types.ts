export type BbmType = 'Pertalite' | 'Pertamax' | 'Pertamax Turbo';

export const BBM_TYPES: readonly BbmType[] = ['Pertalite', 'Pertamax', 'Pertamax Turbo'];

export interface Operator {
  nomor: string;
  nama: string;
  nozzle: string;
  jamMasuk: string;
}

export interface OperatorAccount {
  nomor: string;
  nama: string;
  password: string;
}

export interface Motor {
  plat: string;
  nama: string;
  jenis: string;
  /** Hasil pembacaan AI (opsional). */
  warna?: string;
  berlakuTahun?: number;
  berlakuBulan?: string;
}

export interface Transaksi {
  id: number;
  plat: string;
  /** YYYY-MM-DD, waktu lokal */
  tanggal: string;
  /** HH:mm */
  waktu: string;
  bbm: BbmType;
  liter: number;
  /** Warna kendaraan hasil AI (opsional). */
  warna?: string;
}

export type Route = 'login' | 'beranda' | 'scan' | 'bbm' | 'sukses' | 'riwayat';
