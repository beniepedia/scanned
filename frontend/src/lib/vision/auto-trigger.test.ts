import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutoTrigger } from './auto-trigger.ts';
import type { PlateCandidate } from './plate-detector.ts';

function candidate(x: number, y = 0.4): PlateCandidate {
  return { x, y, width: 0.4, height: 0.13, score: 0.8, whiteRatio: 0.7, contrast: 160 };
}

test('trigger setelah kandidat stabil 3 frame', () => {
  const trigger = createAutoTrigger({ minStable: 3 });

  assert.equal(trigger.push(candidate(0.2)), 'wait');
  assert.equal(trigger.push(candidate(0.2)), 'wait');
  assert.equal(trigger.push(candidate(0.2)), 'trigger');
});

test('trigger hanya sekali sampai direset', () => {
  const trigger = createAutoTrigger({ minStable: 2 });

  trigger.push(candidate(0.2));
  assert.equal(trigger.push(candidate(0.2)), 'trigger');
  assert.equal(trigger.push(candidate(0.2)), 'wait');
});

test('kandidat bergeser jauh mereset hitungan', () => {
  const trigger = createAutoTrigger({ minStable: 3, centerDrift: 0.05 });

  trigger.push(candidate(0.1));
  trigger.push(candidate(0.1));
  assert.equal(trigger.push(candidate(0.6)), 'reset');
  assert.equal(trigger.push(candidate(0.6)), 'wait');
});

test('kandidat hilang mereset hitungan', () => {
  const trigger = createAutoTrigger({ minStable: 3 });

  trigger.push(candidate(0.2));
  trigger.push(candidate(0.2));
  assert.equal(trigger.push(null), 'reset');
  assert.equal(trigger.progress(), 0);
});

test('progress bertambah sesuai jumlah frame stabil', () => {
  const trigger = createAutoTrigger({ minStable: 4 });

  trigger.push(candidate(0.2));
  assert.equal(trigger.progress(), 0.25);
  trigger.push(candidate(0.2));
  assert.equal(trigger.progress(), 0.5);
});
