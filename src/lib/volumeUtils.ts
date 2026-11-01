/**
 * Utility pemformatan dan parsing volume ritase (DT, Ton, Tonase, M3).
 * Mendukung standar angka Indonesia dengan tanda koma (',') untuk desimal,
 * serta otomatis mengonversi titik ('.') menjadi koma saat operator mengetik.
 */

/**
 * Format angka volume untuk tampilan tabel dan modal:
 * - Bilangan bulat: tampil tanpa koma (contoh: 2 -> "2", dengan unit -> "2 DT")
 * - Bilangan desimal: tampil dengan koma maks 2 digit (contoh: 24.5 -> "24,5", 28.75 -> "28,75")
 */
export function formatVolumeDisplay(quantity: number | undefined | null, unit?: string): string {
  const num = Number(quantity) || 0;
  let formatted: string;

  if (num % 1 === 0) {
    formatted = num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  } else {
    formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  const displayUnit = unit === 'M3' || unit === 'm3' ? 'm³' : unit === 'M2' || unit === 'm2' ? 'm²' : unit;
  return displayUnit ? `${formatted} ${displayUnit}` : formatted;
}

/**
 * Memformat angka ke string tampilan input dengan koma desimal Indonesia:
 * Contoh: 24.5 -> "24,5", 1 -> "1"
 */
export function numberToIndonesianInput(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '';
  return String(num).replace('.', ',');
}

/**
 * Sanitasi dan parsing input desimal saat pengguna mengetik:
 * - Otomatis mengganti titik ('.') menjadi koma (',')
 * - Membatasi hanya 1 tanda koma
 * - Menghilangkan karakter selain angka dan koma
 * - Mengembalikan string untuk display dan number untuk kalkulasi live
 */
export function sanitizeDecimalInput(rawVal: string): { displayVal: string; numericVal: number } {
  // 1. Ganti semua titik menjadi koma
  let val = rawVal.replace(/\./g, ',');

  // 2. Hanya izinkan angka dan koma
  val = val.replace(/[^0-9,]/g, '');

  // 3. Batasi hanya 1 tanda koma (ambil koma pertama, buang koma berikutnya)
  const parts = val.split(',');
  if (parts.length > 2) {
    val = parts[0] + ',' + parts.slice(1).join('');
  }

  // 4. Hitung nilai numerik untuk kalkulasi
  const parsedStr = val.replace(',', '.');
  const numericVal = parseFloat(parsedStr);

  return {
    displayVal: val,
    numericVal: isNaN(numericVal) ? 0 : numericVal
  };
}

/**
 * Daftar opsi satuan standar yang tersedia di sistem
 */
export const AVAILABLE_UNITS = [
  { id: 'DT', label: 'DT (Dump Truck)', shortLabel: 'DT' },
  { id: 'Ton', label: 'Ton', shortLabel: 'Ton' },
  { id: 'Tonase', label: 'Tonase', shortLabel: 'Tonase' },
  { id: 'M3', label: 'm³ (Meter Kubik)', shortLabel: 'm³' }
] as const;
