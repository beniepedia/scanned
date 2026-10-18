import type { BbmType, Motor, Transaksi } from '$lib/types';

export interface LoginResult {
  nomor: string;
  nama: string;
}

/**
 * Data access contract. Two implementations ship today:
 *  - local  : seed data + localStorage (default, no backend needed)
 *  - remote : CodeIgniter API under /api/v1
 * Pages and stores only ever talk to this interface, so switching is config-only.
 */
export interface DataRepo {
  login(nomor: string, password: string): Promise<LoginResult>;
  listMotors(): Promise<Motor[]>;
  findMotor(plat: string): Promise<Motor | null>;
  createMotor(motor: Motor): Promise<Motor>;
  listTransaksi(): Promise<Transaksi[]>;
  createTransaksi(input: {
    plat: string;
    bbm: BbmType;
    liter: number;
    warna?: string;
  }): Promise<Transaksi>;
  deleteTransaksi(id: number): Promise<void>;
}

export function messageOf(error: unknown): string {
  return error instanceof Error && error.message !== ''
    ? error.message
    : 'Terjadi kesalahan. Coba lagi.';
}
