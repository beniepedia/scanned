import { repo, messageOf } from '$lib/repo';
import type { BbmType, Transaksi } from '$lib/types';
import { normalisePlat, todayLocal } from '$lib/utils/plate';

export const txState = $state<{ items: Transaksi[]; loading: boolean; error: string }>({
  items: [],
  loading: true,
  error: '',
});

export async function loadTransaksi(): Promise<void> {
  txState.loading = true;
  txState.error = '';

  try {
    txState.items = await repo.listTransaksi();
  } catch (error) {
    txState.error = messageOf(error);
  } finally {
    txState.loading = false;
  }
}

export async function addTransaksi(input: {
  plat: string;
  bbm: BbmType;
  liter: number;
  warna?: string;
}): Promise<Transaksi> {
  const created = await repo.createTransaksi(input);
  txState.items = [created, ...txState.items];
  return created;
}

export async function removeTransaksi(id: number): Promise<void> {
  await repo.deleteTransaksi(id);
  txState.items = txState.items.filter((t) => t.id !== id);
}

/** Riwayat hari ini, terbaru dulu. */
export function hariIni(): Transaksi[] {
  const today = todayLocal();
  return txState.items.filter((t) => t.tanggal === today).sort((a, b) => b.id - a.id);
}

export function sudahIsiHariIni(plat: string): boolean {
  const key = normalisePlat(plat);
  return hariIni().some((t) => t.plat === key);
}

export function ringkasanHariIni(): { count: number; liter: number } {
  const items = hariIni();
  return {
    count: items.length,
    liter: items.reduce((sum, t) => sum + t.liter, 0),
  };
}
