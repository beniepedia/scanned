/**
 * Kompresi gambar sebelum dikirim ke backend AI.
 *
 * Target: sisi terpanjang <= maxDimension, ukuran file <= maxBytes (default 900 KB
 * agar aman di bawah 1 MB). Kualitas dan skala diturunkan bertahap sampai target
 * tercapai; bila batas bawah tercapai, hasil terakhir tetap dikirim.
 */
export const MAX_BYTES = 900_000;
export const MAX_DIMENSION = 1600;
const MIN_QUALITY = 0.5;
const MIN_SCALE = 0.55;
const MAX_ATTEMPTS = 8;

export interface CompressionStep {
  done: boolean;
  quality: number;
  scale: number;
}

/** Fungsi murni (diuji di compress.test.ts). */
export function nextCompressionAttempt(
  size: number,
  quality: number,
  scale: number,
  maxBytes = MAX_BYTES
): CompressionStep {
  if (size <= maxBytes) return { done: true, quality, scale };

  if (quality > MIN_QUALITY) {
    return {
      done: false,
      quality: Math.max(MIN_QUALITY, Number((quality - 0.1).toFixed(2))),
      scale,
    };
  }

  if (scale > MIN_SCALE) {
    return { done: false, quality, scale: Number((scale * 0.85).toFixed(3)) };
  }

  return { done: true, quality, scale };
}

function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob === null ? reject(new Error('Gagal mengompres gambar.')) : resolve(blob)),
      'image/jpeg',
      quality
    );
  });
}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  attempts: number;
}

export async function compressImage(
  source: Blob,
  options: { maxBytes?: number; maxDimension?: number } = {}
): Promise<CompressedImage> {
  const maxBytes = options.maxBytes ?? MAX_BYTES;
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;

  const bitmap = await createImageBitmap(source);

  try {
    let scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    let quality = 0.85;
    let width = bitmap.width;
    let height = bitmap.height;
    let result = source;
    let attempts = 0;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context === null) throw new Error('Canvas 2D tidak tersedia di perangkat ini.');

    context.imageSmoothingQuality = 'high';

    for (;;) {
      attempts += 1;
      width = Math.max(1, Math.round(bitmap.width * scale));
      height = Math.max(1, Math.round(bitmap.height * scale));

      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);

      result = await encode(canvas, quality);

      const next = nextCompressionAttempt(result.size, quality, scale, maxBytes);
      if (next.done || attempts >= MAX_ATTEMPTS) break;

      quality = next.quality;
      scale = next.scale;
    }

    return { blob: result, width, height, attempts };
  } finally {
    bitmap.close();
  }
}
