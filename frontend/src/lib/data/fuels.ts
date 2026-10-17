import type { BbmType } from '$lib/types';

export interface Fuel {
  type: BbmType;
  /** Tailwind token warna aksen sesuai warna nozzle SPBU. */
  accent: string;
  note: string;
}

export const fuels: Fuel[] = [
  { type: 'Pertalite', accent: 'var(--color-fuel-pertalite)', note: 'RON 90 · subsidi' },
  { type: 'Pertamax', accent: 'var(--color-fuel-pertamax)', note: 'RON 92' },
  { type: 'Pertamax Turbo', accent: 'var(--color-fuel-turbo)', note: 'RON 98' },
];
