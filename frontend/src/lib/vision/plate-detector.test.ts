import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRegion, isPlausibleBox, scoreCandidate } from './plate-detector.ts';

test('kotak plat wajar diterima', () => {
  assert.equal(isPlausibleBox({ x: 0.2, y: 0.4, width: 0.4, height: 0.13 }), true);
});

test('kotak terlalu tinggi / terlalu kecil / menempel tepi ditolak', () => {
  assert.equal(isPlausibleBox({ x: 0.2, y: 0.2, width: 0.2, height: 0.4 }), false);
  assert.equal(isPlausibleBox({ x: 0.2, y: 0.4, width: 0.02, height: 0.007 }), false);
  assert.equal(isPlausibleBox({ x: 0, y: 0.4, width: 0.4, height: 0.13 }), false);
});

test('skor lebih tinggi untuk rasio aspek mendekati plat', () => {
  const ideal = scoreCandidate({ x: 0.2, y: 0.4, width: 0.42, height: 0.13 }, 0.8, 180);
  const extreme = scoreCandidate({ x: 0.2, y: 0.4, width: 0.6, height: 0.1 }, 0.8, 180);

  assert.ok(ideal > extreme, `ideal=${ideal} extreme=${extreme}`);
});

test('evaluateRegion: region terang dengan teks gelap menghasilkan kandidat', () => {
  const width = 100;
  const height = 50;
  const luminance = new Uint8Array(width * height).fill(60);

  for (let y = 18; y < 32; y++) {
    for (let x = 20; x < 80; x++) {
      luminance[y * width + x] = (x - 20) % 8 < 4 ? 255 : 20;
    }
  }

  const candidate = evaluateRegion({ minX: 20, minY: 18, maxX: 79, maxY: 31, count: 480 }, width, height, luminance);
  assert.ok(candidate !== null);
  assert.ok(candidate.score > 0.45);
});

test('evaluateRegion: region gelap seragam ditolak', () => {
  const width = 100;
  const height = 50;
  const luminance = new Uint8Array(width * height).fill(40);

  const candidate = evaluateRegion({ minX: 20, minY: 18, maxX: 79, maxY: 31, count: 480 }, width, height, luminance);
  assert.equal(candidate, null);
});

test('evaluateRegion: terlalu sedikit piksel putih ditolak', () => {
  const width = 100;
  const height = 50;
  const luminance = new Uint8Array(width * height).fill(40);

  for (let y = 18; y < 32; y++) {
    for (let x = 20; x < 80; x++) {
      luminance[y * width + x] = 250;
    }
  }

  const candidate = evaluateRegion({ minX: 20, minY: 18, maxX: 79, maxY: 31, count: 60 }, width, height, luminance);
  assert.equal(candidate, null);
});
