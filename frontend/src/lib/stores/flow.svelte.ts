import type { Motor, Transaksi } from '$lib/types';

/** State sementara untuk flow scan -> bbm -> sukses. */
export const flow = $state<{
  plat: string;
  motor: Motor | null;
  last: Transaksi | null;
}>({ plat: '', motor: null, last: null });

export function setPendingPlate(plat: string, motor: Motor | null): void {
  flow.plat = plat;
  flow.motor = motor;
}

export function setPendingMotor(motor: Motor): void {
  flow.motor = motor;
  flow.plat = motor.plat;
}

export function setLastTransaksi(transaksi: Transaksi): void {
  flow.last = transaksi;
}

export function resetFlow(): void {
  flow.plat = '';
  flow.motor = null;
  flow.last = null;
}
