import { normalizeVehicleResult, type VehicleAnalysis } from './normalize';

export type { VehicleAnalysis } from './normalize';

export type VehicleErrorCode = 'network' | 'timeout' | 'rejected' | 'server' | 'unreadable';

export class VehicleApiError extends Error {
  readonly code: VehicleErrorCode;
  readonly status: number;

  constructor(message: string, code: VehicleErrorCode, status = 0) {
    super(message);
    this.name = 'VehicleApiError';
    this.code = code;
    this.status = status;
  }
}

const ENDPOINT = import.meta.env.VITE_AI_URL ?? '/ai/analyze-vehicle';

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export interface AnalyzeOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function analyzeVehicle(
  image: Blob,
  options: AnalyzeOptions = {}
): Promise<VehicleAnalysis> {
  const form = new FormData();
  form.append('file', image, 'capture.jpg');

  const timeout = AbortSignal.timeout(options.timeoutMs ?? 25_000);
  const signal =
    options.signal === undefined ? timeout : AbortSignal.any([options.signal, timeout]);

  let response: Response;

  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (caught) {
    const timedOut = caught instanceof DOMException && caught.name === 'TimeoutError';
    throw new VehicleApiError(
      timedOut
        ? 'Server AI terlalu lama merespons. Coba lagi.'
        : 'Tidak bisa menghubungi server AI. Periksa koneksi jaringan.',
      timedOut ? 'timeout' : 'network'
    );
  }

  const payload = asRecord(await response.json().catch(() => null));

  if (!response.ok || payload.success !== true) {
    const message =
      typeof payload.message === 'string' && payload.message !== ''
        ? payload.message
        : 'Gambar belum bisa dianalisis.';

    throw new VehicleApiError(
      message,
      response.status >= 500 ? 'server' : 'rejected',
      response.status
    );
  }

  const result = normalizeVehicleResult(payload.data);

  if (result.plate === null) {
    throw new VehicleApiError('Plat tidak terbaca. Ulangi pengambilan gambar.', 'unreadable', 422);
  }

  return result;
}
