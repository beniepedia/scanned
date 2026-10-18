import { api } from '$lib/api/endpoints';
import type { DataRepo } from './types';

/** CodeIgniter API implementation. Enable with VITE_DATA_SOURCE=remote. */
export function createRemoteRepo(): DataRepo {
  return {
    login: (nomor, password) => api.login(nomor, password),

    listMotors: () => api.motors(),

    async findMotor(plat) {
      try {
        return await api.motor(plat);
      } catch {
        return null;
      }
    },

    createMotor: (motor) => api.createMotor(motor),

    listTransaksi: () => api.transaksi(),

    createTransaksi: (input) => api.createTransaksi(input),

    async deleteTransaksi(id) {
      await api.deleteTransaksi(id);
    },
  };
}
