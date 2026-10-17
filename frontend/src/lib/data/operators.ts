import type { OperatorAccount } from '$lib/types';

/** Dummy operator accounts - password "1234" for every nomor. */
export const operators: OperatorAccount[] = [
  { nomor: '21045', nama: 'Andi', password: '1234' },
  { nomor: '21046', nama: 'Budi', password: '1234' },
  { nomor: '21047', nama: 'Citra', password: '1234' },
];

export const DEMO_OPERATOR = operators[0];

export const NOZZLES = ['01', '02', '03', '04'] as const;
