import type { Motor, ScanResult, Transaksi } from '$lib/types';
import { seedMotors } from '$lib/data/motors';
import { operators } from '$lib/data/operators';
import { seedTransaksi } from '$lib/data/seed';
import { extractPlatFromText, normalisePlat, nowTime, todayLocal } from '$lib/utils/plate';
import type { DataRepo, LoginResult } from './types';

const MOTOR_KEY = 'spbu:motors';
const TX_KEY = 'spbu:transaksi';

function read<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? structuredClone(seed) : (JSON.parse(raw) as T);
  } catch {
    return structuredClone(seed);
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage penuh / disabled: state tetap hidup selama sesi berjalan.
  }
}

const motors = () => read<Motor[]>(MOTOR_KEY, seedMotors);
const transaksi = () => read<Transaksi[]>(TX_KEY, seedTransaksi);

/** Dummy implementation: everything lives in localStorage, never in a database. */
export function createLocalRepo(): DataRepo {
  return {
    async login(nomor, password): Promise<LoginResult> {
      const account = operators.find((o) => o.nomor === nomor.trim() && o.password === password.trim());
      if (!account) throw new Error('Nomor operator atau password salah.');
      return { nomor: account.nomor, nama: account.nama };
    },

    async listMotors() {
      return motors();
    },

    async findMotor(plat) {
      const key = normalisePlat(plat);
      return motors().find((m) => m.plat === key) ?? null;
    },

    async createMotor(motor) {
      const rows = motors();
      const plat = normalisePlat(motor.plat);
      const existing = rows.find((m) => m.plat === plat);
      if (existing) return existing;

      const created: Motor = { plat, nama: motor.nama.trim(), jenis: motor.jenis.trim() };
      rows.push(created);
      write(MOTOR_KEY, rows);
      return created;
    },

    async listTransaksi() {
      return transaksi().sort((a, b) => b.id - a.id);
    },

    async createTransaksi({ plat, bbm, liter }) {
      const rows = transaksi();
      const created: Transaksi = {
        id: rows.reduce((max, t) => Math.max(max, t.id), 0) + 1,
        plat: normalisePlat(plat),
        tanggal: todayLocal(),
        waktu: nowTime(),
        bbm,
        liter,
      };
      rows.push(created);
      write(TX_KEY, rows);
      return created;
    },

    async deleteTransaksi(id) {
      write(TX_KEY, transaksi().filter((t) => t.id !== id));
    },

    async scanText(text): Promise<ScanResult> {
      const plat = extractPlatFromText(text);
      if (plat === null) throw new Error('Nomor plat tidak terbaca. Coba foto ulang atau input manual.');

      const motor = motors().find((m) => m.plat === plat) ?? null;
      const today = todayLocal();
      const sudahIsiHariIni = transaksi().some((t) => t.plat === plat && t.tanggal === today);

      return { plat, motor, sudahIsiHariIni };
    },
  };
}