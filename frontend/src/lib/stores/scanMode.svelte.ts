const KEY = 'spbu:scanMode';

export type ScanMode = 'manual' | 'auto';

function load(): ScanMode {
  try {
    return localStorage.getItem(KEY) === 'auto' ? 'auto' : 'manual';
  } catch {
    return 'manual';
  }
}

export const scanMode = $state<{ mode: ScanMode }>({ mode: load() });

export function setScanMode(mode: ScanMode): void {
  scanMode.mode = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // ignore
  }
}
