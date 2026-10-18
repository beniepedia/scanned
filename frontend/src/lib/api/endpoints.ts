import { http } from './client';
import type { BbmType, Motor, Transaksi } from '$lib/types';

export interface LoginResponse {
  nomor: string;
  nama: string;
}

export interface TransaksiMeta {
  total: number;
  liter: number;
  tanggal: string;
}

export const api = {
  login: (nomor: string, password: string) =>
    http.post<LoginResponse>('/operators/login', { nomor, password }),

  motors: () => http.get<Motor[]>('/motors'),
  motor: (plat: string) => http.get<Motor>(`/motors/${encodeURIComponent(plat)}`),
  createMotor: (body: Motor) => http.post<Motor>('/motors', body),

  transaksi: () => http.get<Transaksi[]>('/transaksi'),
  createTransaksi: (body: { plat: string; bbm: BbmType; liter: number; warna?: string }) =>
    http.post<Transaksi>('/transaksi', body),
  deleteTransaksi: (id: number) => http.delete<{ id: number }>(`/transaksi/${id}`),
};
