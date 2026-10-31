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
 * Format ringkas berjenjang (K, Jt, Mil, Tri) untuk nominal uang saat wadah sempit/overflow.
 * Sesuai aturan:
 * - < 1.000: Angka penuh (e.g. 500)
 * - 1.000 - 999.999: Ribuan / K (e.g. 750K, 12,5K)
 * - 1.000.000 - 999.999.999: Jutaan / Jt (e.g. 12,5 Jt, 50 Jt)
 * - 1.000.000.000 - 999.999.999.999: Miliaran / Mil (e.g. 125,23 Mil)
 * - >= 1.000.000.000.000: Triliunan / Tri (e.g. 1,5 Tri)
 * Maksimal 2 desimal dengan pemisah koma Indonesia, memotong angka nol mubazir di akhir.
 */
export interface SimplifiedCurrencyResult {
  value: string;
  suffix: string; // '', 'K', 'Jt', 'Mil', 'Tri'
  formatted: string; // e.g. "125,23 Mil" atau "750K"
  withRp: string; // e.g. "Rp 125,23 Mil" atau "-Rp 125,23 Mil"
}

export function formatSimplifiedCurrency(amount: number): SimplifiedCurrencyResult {
  const isNegative = (amount || 0) < 0;
  const absVal = Math.abs(amount || 0);

  if (absVal < 1000) {
    const formatted = Math.round(absVal).toLocaleString('id-ID');
    return {
      value: formatted,
      suffix: '',
      formatted,
      withRp: `${isNegative ? '-Rp ' : 'Rp '}${formatted}`
    };
  }

  let divisor = 1;
  let suffix = '';

  if (absVal >= 1_000_000_000_000) {
    divisor = 1_000_000_000_000;
    suffix = 'Tri';
  } else if (absVal >= 1_000_000_000) {
    divisor = 1_000_000_000;
    suffix = 'Mil';
  } else if (absVal >= 1_000_000) {
    divisor = 1_000_000;
    suffix = 'Jt';
  } else {
    divisor = 1_000;
    suffix = 'K';
  }

  const rawNumber = absVal / divisor;
  // Pembulatan maksimal 2 angka desimal
  const rounded = Math.round(rawNumber * 100) / 100;

  // Pisahkan bagian integer dan desimal
  const numParts = rounded.toString().split('.');
  const integerPart = parseInt(numParts[0] || '0', 10).toLocaleString('id-ID');
  const decimalPart = numParts[1] ? numParts[1] : '';

  const valueStr = decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  const suffixWithSpace = suffix === 'K' ? 'K' : ` ${suffix}`;
  const formatted = `${valueStr}${suffixWithSpace}`;

  return {
    value: valueStr,
    suffix,
    formatted,
    withRp: `${isNegative ? '-Rp ' : 'Rp '}${formatted}`
  };
}

/**
 * Helper string langsung untuk format Rupiah ringkas berjenjang (K, Jt, Mil, Tri).
 * Contoh: formatRupiahSimplified(125230000000) -> "Rp 125,23 Mil"
 */
export function formatRupiahSimplified(amount: number): string {
  return formatSimplifiedCurrency(amount).withRp;
}

/**
 * Alias kompatibilitas untuk format Rupiah ringkas berjenjang.
 */
export function formatRupiahCompact(amount: number): string {
  return formatSimplifiedCurrency(amount).withRp;
}


