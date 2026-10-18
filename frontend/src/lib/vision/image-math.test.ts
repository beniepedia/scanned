import { test } from 'node:test';
import assert from 'node:assert/strict';
import { laplacianVariance, otsuThreshold } from './image-math.ts';

function histogramFrom(values: number[]): Uint32Array {
  const histogram = new Uint32Array(256);
  for (const value of values) histogram[Math.max(0, Math.min(255, value))] += 1;
  return histogram;
}

test('otsu memisahkan dua puncak', () => {
  const threshold = otsuThreshold(histogramFrom([...Array(500).fill(20), ...Array(500).fill(230)]));
  assert.ok(threshold > 20 && threshold < 230, `threshold=${threshold}`);
});

test('otsu histogram kosong mengembalikan default', () => {
  assert.equal(otsuThreshold(new Uint32Array(256)), 128);
});

test('laplacian: bidang rata bernilai 0', () => {
  const gray = new Uint8Array(16 * 16).fill(120);
  assert.equal(laplacianVariance(gray, 16, 16), 0);
});

test('laplacian: pola kotak-kotak bernilai tinggi (tajam)', () => {
  const width = 16;
  const height = 16;
  const gray = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      gray[y * width + x] = (x + y) % 2 === 0 ? 255 : 0;
    }
  }

  assert.ok(laplacianVariance(gray, width, height) > 1000);
});
