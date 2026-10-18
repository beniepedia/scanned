import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVehicleResult } from './normalize.ts';

test('normalize: plat dirapikan, warna lowercase, bulan/tahun divalidasi', () => {
  const result = normalizeVehicleResult({
    plate: 'b 1234 abc',
    color: 'Putih',
    year: '2025',
    month: 8,
  });

  assert.deepEqual(result, {
    plate: 'B1234ABC',
    color: 'putih',
    year: 2025,
    month: '08',
  });
});

test('normalize: field opsional boleh kosong', () => {
  const result = normalizeVehicleResult({ plate: 'D901GHI' });

  assert.deepEqual(result, { plate: 'D901GHI', color: null, year: null, month: null });
});

test('normalize: plat tidak valid menjadi null', () => {
  assert.equal(normalizeVehicleResult({ plate: '1234' }).plate, null);
  assert.equal(normalizeVehicleResult({ plate: 'tidak terbaca' }).plate, null);
  assert.equal(normalizeVehicleResult({}).plate, null);
});

test('normalize: tahun & bulan aneh diabaikan', () => {
  const result = normalizeVehicleResult({ plate: 'B1234ABC', year: 12, month: 99 });

  assert.equal(result.year, null);
  assert.equal(result.month, null);
});
