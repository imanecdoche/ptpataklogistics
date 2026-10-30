/**
 * Utilitas pemformatan dan pembersihan nomor telepon Indonesia (+62 8xx-xxxx-xxxx)
 */

/**
 * Membersihkan dan mengekstrak digit nomor telepon Indonesia tanpa angka 0 di depan dan tanpa 62.
 * Contoh input:
 * - "081234567890" -> "81234567890"
 * - "+62 812-3456-7890" -> "81234567890"
 * - "6281234567890" -> "81234567890"
 * - "0812-3456-7890" -> "81234567890"
 */
export function extractIndonesianPhoneDigits(input: string): string {
  if (!input) return '';
  // 1. Ambil hanya digit angka
  let digits = input.replace(/\D/g, '');

  // 2. Jika diawali kode negara 62, hilangkan 62
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  }

  // 3. Hilangkan angka 0 di awal nomor
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Batasi panjang maksimal digit nomor lokal Indonesia (maks 12 digit setelah +62)
  return digits.slice(0, 12);
}

/**
 * Memformat nomor telepon menjadi format kanonikal resmi: '+62 8xx-xxxx-xxxx'
 * Jika kosong, mengembalikan string kosong "" (tanpa meninggalkan prefix menggantung).
 */
export function formatPhoneNumber(input: string): string {
  const digits = extractIndonesianPhoneDigits(input);
  if (!digits) return '';

  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 7);
  const part3 = digits.slice(7, 12);

  let formattedBody = part1;
  if (part2) formattedBody += '-' + part2;
  if (part3) formattedBody += '-' + part3;

  return `+62 ${formattedBody}`;
}

/**
 * Format live bagian isi nomor (tanpa prefix +62) untuk tampilan di input box
 * Contoh output: "812-3456-7890"
 */
export function formatPhoneBodyLive(input: string): string {
  const digits = extractIndonesianPhoneDigits(input);
  if (!digits) return '';

  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 7);
  const part3 = digits.slice(7, 12);

  let formatted = part1;
  if (part2) formatted += '-' + part2;
  if (part3) formatted += '-' + part3;

  return formatted;
}
