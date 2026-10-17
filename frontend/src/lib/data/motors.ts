import type { Motor } from '$lib/types';
import { normalisePlat } from '$lib/utils/plate';

/** Seed data ported from the Expo source (src/data/motors.json). */
const RAW: Motor[] = [
  { plat: 'B 1234 ABC', nama: 'Andi', jenis: 'Honda Vario 125' },
  { plat: 'B 5678 DEF', nama: 'Budi', jenis: 'Yamaha NMAX' },
  { plat: 'D 901 GHI', nama: 'Citra', jenis: 'Honda Beat' },
  { plat: 'B 2345 JKL', nama: 'Dedi', jenis: 'Suzuki Satria F150' },
  { plat: 'F 6789 MNO', nama: 'Eka', jenis: 'Yamaha Mio M3' },
  { plat: 'B 3456 PQR', nama: 'Fajar', jenis: 'Honda PCX 160' },
  { plat: 'AB 890 STU', nama: 'Gita', jenis: 'Honda Scoopy' },
  { plat: 'B 4567 VWX', nama: 'Hendra', jenis: 'Yamaha Aerox 155' },
  { plat: 'N 123 YZ', nama: 'Intan', jenis: 'Honda Genio' },
  { plat: 'B 7890 QRS', nama: 'Joko', jenis: 'Yamaha Lexi 125' },
];

export const seedMotors: Motor[] = RAW.map((m) => ({ ...m, plat: normalisePlat(m.plat) }));
