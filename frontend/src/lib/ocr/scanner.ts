import Tesseract from 'tesseract.js';

/**
 * Browser-side plate OCR.
 *
 * The worker is created once (language data is ~15 MB on first use, then cached
 * by the browser) and terminated when the scan screen unmounts.
 */
let workerPromise: Promise<Tesseract.Worker> | null = null;

export type OcrStatus = (status: string, progress: number) => void;

export async function getOcrWorker(onStatus?: OcrStatus): Promise<Tesseract.Worker> {
  workerPromise ??= (async () => {
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (message: { status: string; progress: number }) =>
        onStatus?.(message.status, message.progress),
    });

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      preserve_interword_spaces: '1',
    });

    return worker;
  })();

  return workerPromise;
}

export async function terminateOcr(): Promise<void> {
  if (workerPromise === null) return;

  const worker = await workerPromise.catch(() => null);
  workerPromise = null;
  await worker?.terminate();
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Area plat di dalam frame, dalam fraksi 0..1 (default: tengah frame). */
export const DEFAULT_REGION: CropRegion = { x: 0.12, y: 0.34, width: 0.76, height: 0.26 };

/**
 * Crop + grayscale + threshold + 2x upscale. Tesseract is much more reliable on
 * a high-contrast, tightly cropped plate than on a full camera frame.
 */
export function preprocessFrame(
  video: HTMLVideoElement,
  region: CropRegion = DEFAULT_REGION
): HTMLCanvasElement {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (sourceWidth === 0 || sourceHeight === 0) {
    throw new Error('Frame kamera belum siap.');
  }

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sourceWidth * region.width * scale);
  canvas.height = Math.round(sourceHeight * region.height * scale);

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (context === null) {
    throw new Error('Canvas 2D tidak tersedia di perangkat ini.');
  }

  context.drawImage(
    video,
    sourceWidth * region.x,
    sourceHeight * region.y,
    sourceWidth * region.width,
    sourceHeight * region.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  let luminanceSum = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    luminanceSum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  const mean = luminanceSum / (pixels.length / 4);
  const threshold = Math.min(175, Math.max(95, mean * 0.85));

  for (let i = 0; i < pixels.length; i += 4) {
    const grey = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    const value = grey < threshold ? 0 : 255;
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }

  context.putImageData(image, 0, 0);

  return canvas;
}

export async function recognise(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await getOcrWorker();
  const { data } = await worker.recognize(canvas);

  return data.text;
}
