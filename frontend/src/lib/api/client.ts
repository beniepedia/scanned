const BASE = (import.meta.env.VITE_API_BASE ?? '/api/v1').replace(/\/+$/, '');

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
  errors?: Record<string, string>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errors: Record<string, string>;

  constructor(message: string, status = 0, errors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: init.signal ?? AbortSignal.timeout(15_000),
    });
  } catch (cause) {
    throw new ApiError('Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.', 0, {
      cause: String(cause),
    });
  }

  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || payload === null || payload.success !== true) {
    throw new ApiError(
      payload?.message ?? `Permintaan gagal (HTTP ${response.status}).`,
      response.status,
      payload?.errors ?? {}
    );
  }

  return payload.data;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
