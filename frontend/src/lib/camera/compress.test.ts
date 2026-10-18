import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextCompressionAttempt } from './compress.ts';

test('selesai bila ukuran sudah di bawah batas', () => {
  const step = nextCompressionAttempt(800_000, 0.85, 1);

  assert.equal(step.done, true);
  assert.equal(step.quality, 0.85);
});

test('turunkan kualitas dulu sebelum mengecilkan dimensi', () => {
  const step = nextCompressionAttempt(1_500_000, 0.85, 1);

  assert.equal(step.done, false);
  assert.equal(step.quality, 0.75);
  assert.equal(step.scale, 1);
});

test('setelah kualitas menyentuh batas bawah, skala diturunkan', () => {
  const step = nextCompressionAttempt(1_200_000, 0.5, 1);

  assert.equal(step.done, false);
  assert.equal(step.quality, 0.5);
  assert.ok(step.scale < 1);
});

test('berhenti saat kualitas & skala sudah di batas bawah', () => {
  const step = nextCompressionAttempt(2_000_000, 0.5, 0.55);

  assert.equal(step.done, true);
});
