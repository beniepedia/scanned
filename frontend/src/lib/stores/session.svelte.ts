import type { Operator } from '$lib/types';

const KEY = 'spbu:session';

function load(): Operator | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? null : (JSON.parse(raw) as Operator);
  } catch {
    return null;
  }
}

export const session = $state<{ operator: Operator | null }>({ operator: load() });

export function beginSession(nomor: string, nama: string, nozzle: string, jamMasuk: string): void {
  session.operator = { nomor, nama, nozzle, jamMasuk };
  write({ ...session.operator });
}

export function endSession(): void {
  session.operator = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

function write(operator: Operator): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(operator));
  } catch {
    // ignore
  }
}
