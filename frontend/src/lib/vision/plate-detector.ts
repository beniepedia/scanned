import { laplacianVariance, otsuThreshold } from './image-math.ts';

export interface Box {
  /** Normalised 0..1 terhadap lebar frame. */
  x: number;
  /** Normalised 0..1 terhadap tinggi frame. */
  y: number;
  width: number;
  height: number;
}

export interface PlateCandidate extends Box {
  score: number;
  whiteRatio: number;
  contrast: number;
}

const ASPECT_MIN = 2;
const ASPECT_MAX = 6;
const ASPECT_IDEAL = 3.2;
const MIN_AREA = 0.005;
const MAX_AREA = 0.4;
const MIN_WHITE_RATIO = 0.35;
const MIN_CONTRAST = 55;
const EDGE_MARGIN = 0.01;

/** Filter bentuk dasar: rasio aspek, ukuran, tidak menempel tepi frame. */
export function isPlausibleBox(box: Box, threshold = 0.5): boolean {
  if (box.width <= 0 || box.height <= 0) return false;

  const aspect = box.width / box.height;
  if (aspect < ASPECT_MIN || aspect > ASPECT_MAX) return false;

  const area = box.width * box.height;
  if (area < MIN_AREA || area > MAX_AREA) return false;

  if (box.x < EDGE_MARGIN || box.y < EDGE_MARGIN) return false;
  if (box.x + box.width > 1 - EDGE_MARGIN || box.y + box.height > 1 - EDGE_MARGIN) return false;

  return aspect > 0 && box.width > threshold / 1000;
}

/** Skor gabungan: bentuk, porsi area putih, luas, kontras. */
export function scoreCandidate(
  box: Box,
  whiteRatio: number,
  contrast: number
): number {
  const aspect = box.width / box.height;
  const aspectScore = Math.max(0, 1 - Math.abs(aspect - ASPECT_IDEAL) / ASPECT_IDEAL);
  const areaScore = Math.min(1, (box.width * box.height) / 0.12);
  const contrastScore = Math.min(1, Math.max(0, (contrast - MIN_CONTRAST) / 120));

  return Number(
    (0.4 * aspectScore + 0.3 * Math.min(1, whiteRatio) + 0.2 * areaScore + 0.1 * contrastScore).toFixed(3)
  );
}

interface Region {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  count: number;
}

/** Ubah region + statistik piksel menjadi kandidat (null bila tidak layak). */
export function evaluateRegion(
  region: Region,
  frameWidth: number,
  frameHeight: number,
  luminance: Uint8Array
): PlateCandidate | null {
  const width = (region.maxX - region.minX + 1) / frameWidth;
  const height = (region.maxY - region.minY + 1) / frameHeight;
  const box: Box = {
    x: region.minX / frameWidth,
    y: region.minY / frameHeight,
    width,
    height,
  };

  if (!isPlausibleBox(box)) return null;

  const boxAreaPixels = (region.maxX - region.minX + 1) * (region.maxY - region.minY + 1);
  const whiteRatio = region.count / boxAreaPixels;
  if (whiteRatio < MIN_WHITE_RATIO) return null;

  let minLum = 255;
  let maxLum = 0;
  for (let y = region.minY; y <= region.maxY; y++) {
    for (let x = region.minX; x <= region.maxX; x++) {
      const value = luminance[y * frameWidth + x];
      if (value < minLum) minLum = value;
      if (value > maxLum) maxLum = value;
    }
  }

  const contrast = maxLum - minLum;
  if (contrast < MIN_CONTRAST) return null;

  return { ...box, whiteRatio, contrast, score: scoreCandidate(box, whiteRatio, contrast) };
}

let canvas: HTMLCanvasElement | null = null;

/** Ketajaman frame (varians Laplacian pada grayscale 384 px). */
export function frameSharpness(video: HTMLVideoElement, width = 384): number {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (sourceWidth === 0 || sourceHeight === 0) return 0;

  const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * width));

  canvas ??= document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) return 0;

  context.drawImage(video, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const gray = new Uint8Array(width * height);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    gray[p] = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
  }

  return laplacianVariance(gray, width, height);
}

export interface DetectOptions {
  /** Lebar kerja deteksi (px). Default 384 — cukup untuk plat. */
  width?: number;
  /** Skor minimum agar kandidat dikembalikan. */
  minScore?: number;
  /** Maksimum kandidat yang dikembalikan. */
  limit?: number;
}

/**
 * Deteksi plat heuristik (tanpa model): ambang Otsu → connected components →
 * filter bentuk/kontras. Cukup sebagai pemicu auto-scan; pembacaan teks
 * dilakukan backend AI.
 */
export function detectPlate(video: HTMLVideoElement, options: DetectOptions = {}): PlateCandidate[] {
  if (import.meta.env.VITE_VISION_STUB === '1') {
    return [
      {
        x: 0.25,
        y: 0.42,
        width: 0.5,
        height: 0.15,
        score: 0.9,
        whiteRatio: 0.6,
        contrast: 140,
      },
    ];
  }

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (sourceWidth === 0 || sourceHeight === 0) return [];

  const width = options.width ?? 384;
  const height = Math.max(1, Math.round((sourceHeight / sourceWidth) * width));

  canvas ??= document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) return [];

  context.drawImage(video, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;

  const total = width * height;
  const luminance = new Uint8Array(total);
  const histogram = new Uint32Array(256);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const grey = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
    luminance[p] = grey;
    histogram[grey] += 1;
  }

  const threshold = otsuThreshold(histogram);
  const binary = new Uint8Array(total);
  for (let p = 0; p < total; p++) binary[p] = luminance[p] >= threshold ? 1 : 0;

  const regions = labelRegions(binary, width, height);
  const minScore = options.minScore ?? 0.45;
  const limit = options.limit ?? 3;

  const candidates: PlateCandidate[] = [];

  for (const region of regions) {
    const candidate = evaluateRegion(region, width, height, luminance);
    if (candidate !== null && candidate.score >= minScore) candidates.push(candidate);
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Connected-component labeling dua-pass (union-find) pada piksel biner. */
function labelRegions(binary: Uint8Array, width: number, height: number): Region[] {
  const labels = new Int32Array(binary.length).fill(0);
  const parent: number[] = [0];
  let nextLabel = 1;

  const find = (label: number): number => {
    let root = label;
    while (parent[root] !== root) root = parent[root];
    let current = label;
    while (parent[current] !== root) {
      const next = parent[current];
      parent[current] = root;
      current = next;
    }
    return root;
  };

  const union = (a: number, b: number): void => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[Math.max(rootA, rootB)] = Math.min(rootA, rootB);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (binary[index] === 0) continue;

      const left = x > 0 ? labels[index - 1] : 0;
      const up = y > 0 ? labels[index - width] : 0;

      if (left === 0 && up === 0) {
        parent.push(nextLabel);
        labels[index] = nextLabel;
        nextLabel += 1;
      } else if (left !== 0 && up !== 0) {
        labels[index] = Math.min(left, up);
        union(left, up);
      } else {
        labels[index] = left === 0 ? up : left;
      }
    }
  }

  const stats = new Map<number, Region>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const label = labels[y * width + x];
      if (label === 0) continue;

      const root = find(label);
      const region = stats.get(root);

      if (region === undefined) {
        stats.set(root, { minX: x, minY: y, maxX: x, maxY: y, count: 1 });
      } else {
        region.minX = Math.min(region.minX, x);
        region.minY = Math.min(region.minY, y);
        region.maxX = Math.max(region.maxX, x);
        region.maxY = Math.max(region.maxY, y);
        region.count += 1;
      }
    }
  }

  return [...stats.values()];
}
