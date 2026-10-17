/** Angka liter tanpa nol ekor: 2.5 -> "2,5", 4 -> "4". */
export function liter(value: number): string {
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/** "07:15" -> "07:15" (placeholder agar format konsisten di satu tempat). */
export function time(value: string): string {
  return value.slice(0, 5);
}
