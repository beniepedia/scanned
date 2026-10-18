import { isPlatValid, normalisePlat } from '../utils/plate.ts';

export interface VehicleAnalysis {
  color: string | null;
  plate: string | null;
  year: number | null;
  month: string | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/** Normalisasi keluaran backend; hanya `plate` yang divalidasi ketat. */
export function normalizeVehicleResult(raw: unknown): VehicleAnalysis {
  const record = asRecord(raw);

  const colorRaw = typeof record.color === 'string' ? record.color.trim().toLowerCase() : '';

  const plateRaw = typeof record.plate === 'string' ? record.plate : '';
  const plateKey = normalisePlat(plateRaw);

  const yearValue = Number(record.year);
  const year =
    Number.isInteger(yearValue) && yearValue >= 1900 && yearValue <= 2100 ? yearValue : null;

  const monthValue = String(record.month ?? '').replace(/\D/g, '').padStart(2, '0');
  const month = /^(0[1-9]|1[0-2])$/.test(monthValue) ? monthValue : null;

  return {
    color: colorRaw === '' ? null : colorRaw,
    plate: isPlatValid(plateKey) ? plateKey : null,
    year,
    month,
  };
}
