/**
 * Utilitas Pemformatan Mata Uang Universal (Rupiah)
 * Mematuhi Aturan 99 dan Aturan 116:
 * - Standar format nominal Rupiah (id-ID)
 * - Format ringkas akhiran 'K' (kilo / ribuan) untuk nominal besar saat overflow / wadah sempit
 * - Contoh: 1.000.000.000 -> 1.000.000K, 25.000.000 -> 25.000K
 */

/**
 * Memformat angka menjadi format string nominal Rupiah penuh standar (id-ID).
 * Contoh: 1000000 -> "Rp 1.000.000"
 */
export function formatRupiah(amount: number): string {
  const isNegative = (amount || 0) < 0;
  const absVal = Math.abs(Math.round(amount || 0));
  const formatted = absVal.toLocaleString('id-ID');
  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

/**
 * Memformat angka menjadi format ringkas akhiran 'K' (memotong 3 nol terakhir).
 * Contoh: 1.000.000.000 -> "1.000.000K"
 */
export function formatCompactK(amount: number): string {
  const isNegative = (amount || 0) < 0;
  const absVal = Math.abs(amount || 0);

  // Jika nilai absolut di bawah 1.000, tidak perlu dipotong K
  if (absVal < 1000) {
    const formatted = Math.round(absVal).toLocaleString('id-ID');
    return `${isNegative ? '-' : ''}${formatted}`;
  }

  // Potong 3 digit nol (dibagi 1.000) dan bulatkan
  const inK = Math.round(absVal / 1000);
  const formatted = inK.toLocaleString('id-ID') + 'K';
  return `${isNegative ? '-' : ''}${formatted}`;
}

/**
 * Memformat angka menjadi format Rupiah ringkas dengan prefix 'Rp'.
 * Contoh: 1.000.000.000 -> "Rp 1.000.000K"
 */
export function formatRupiahCompact(amount: number): string {
  const isNegative = (amount || 0) < 0;
  const absVal = Math.abs(amount || 0);

  if (absVal < 1000) {
    const formatted = Math.round(absVal).toLocaleString('id-ID');
    return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
  }

  const inK = Math.round(absVal / 1000);
  const formatted = inK.toLocaleString('id-ID') + 'K';
  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}
