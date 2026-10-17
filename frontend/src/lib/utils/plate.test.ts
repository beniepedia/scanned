import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalisePlat,
  isPlatValid,
  formatPlat,
  extractPlatFromText,
  todayLocal,
} from './plate.ts';

test('normalisePlat buang spasi & huruf kecil', () => {
  assert.equal(normalisePlat('b 1234 abc'), 'B1234ABC');
  assert.equal(normalisePlat('D-12 AB'), 'D12AB');
});

test('isPlatValid pola plat RI', () => {
  assert.ok(isPlatValid('B 1234 ABC'));
  assert.ok(isPlatValid('N 9876 YZ'));
  assert.ok(isPlatValid('AB 890 STU'));
  assert.ok(!isPlatValid('1234'));
  assert.ok(!isPlatValid('B ABC DEF'));
  assert.ok(!isPlatValid(''));
});

test('formatPlat tambah spasi', () => {
  assert.equal(formatPlat('b1234abc'), 'B 1234 ABC');
  assert.equal(formatPlat('AB890STU'), 'AB 890 STU');
});

test('extractPlatFromText temukan plat di hasil OCR ber-noise', () => {
  assert.equal(extractPlatFromText('BOGOR VIHARA B 1234 ABC TERIMA KASIH'), 'B1234ABC');
  assert.equal(extractPlatFromText('BOGOR VIHARA B1234ABC TERIMA KASIH'), 'B1234ABC');
  assert.equal(extractPlatFromText('no plate found here 112233'), null);
});

test('todayLocal berformat YYYY-MM-DD', () => {
  assert.match(todayLocal(), /^\d{4}-\d{2}-\d{2}$/);
});
