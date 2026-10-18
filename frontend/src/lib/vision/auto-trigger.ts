import type { PlateCandidate } from './plate-detector';

export type TriggerState = 'wait' | 'trigger' | 'reset';

export interface AutoTrigger {
  push(candidate: PlateCandidate | null): TriggerState;
  reset(): void;
  progress(): number;
}

export interface TriggerOptions {
  /** Jumlah frame stabil sebelum memicu capture. */
  minStable?: number;
  /** Toleransi geser pusat (fraksi lebar frame). */
  centerDrift?: number;
}

/**
 * Menentukan kapan frame layak dikirim ke backend: kandidat plat harus muncul
 * stabil beberapa frame berturut-turut. Murni (tanpa DOM) agar bisa diuji.
 */
export function createAutoTrigger(options: TriggerOptions = {}): AutoTrigger {
  const minStable = Math.max(2, options.minStable ?? 3);
  const drift = options.centerDrift ?? 0.05;

  let centers: { x: number; y: number }[] = [];
  let fired = false;

  return {
    push(candidate: PlateCandidate | null): TriggerState {
      if (candidate === null) {
        const wasActive = centers.length > 0;
        centers = [];
        fired = false;

        return wasActive ? 'reset' : 'wait';
      }

      const center = { x: candidate.x + candidate.width / 2, y: candidate.y + candidate.height / 2 };
      const reference = centers.at(-1);

      if (reference && Math.hypot(center.x - reference.x, center.y - reference.y) > drift) {
        centers = [center];
        fired = false;

        return 'reset';
      }

      centers.push(center);
      if (centers.length > minStable) centers.shift();

      if (centers.length >= minStable && !fired) {
        fired = true;

        return 'trigger';
      }

      return 'wait';
    },

    reset(): void {
      centers = [];
      fired = false;
    },

    progress(): number {
      return Math.min(1, centers.length / minStable);
    },
  };
}
