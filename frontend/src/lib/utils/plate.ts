/**
 * Plat nomor Indonesia: "B 1234 ABC", "D 12 AB", "N 9876 YZ".
 * Mirror of app/Libraries/Plate.php - keep both in sync.
 */
const PLAT_RE = /^([A-Z]{1,2})([0-9]{1,4})([A-Z]{1,3})$/;

/** Uppercase, buang spasi/dash. */
export function normalisePlat(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, '');
}

export function isPlatValid(raw: string): boolean {
  return PLAT_RE.test(normalisePlat(raw));
}

/** "B1234ABC" -> "B 1234 ABC"; input tidak valid dikembalikan apa adanya. */
export function formatPlat(raw: string): string {
  const key = normalisePlat(raw);
  const match = PLAT_RE.exec(key);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : key;
}

export function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function nowTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
