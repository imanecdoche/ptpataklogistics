/**
 * Utilitas Pemformatan dan Standardisasi Nama Universal
 * Mematuhi Aturan 39, Aturan 50, dan Aturan 101:
 * - Auto-kapitalisasi huruf besar di awal kata (Title Case)
 * - Standardisasi badan usaha PUEBI: PT, CV, UD, KM (tanpa titik), Tbk
 * - Preservasi spasi pengetikan (trailing space) saat onChange live
 */

/**
 * Format satu kata/token dengan preservasi kurung buka/tutup ( )
 */
export function formatNameWord(token: string): string {
  if (!token) return '';
  const startsWithParen = token.startsWith('(');
  const endsWithParen = token.endsWith(')');
  const core = token.replace(/[()]/g, '');
  if (!core) return token;

  const upper = core.toUpperCase();
  let formatted = '';

  // Singkatan badan usaha resmi
  if (['PT', 'CV', 'UD', 'KM', 'TBK'].includes(upper)) {
    formatted = upper === 'TBK' ? 'Tbk' : upper;
  } else if (/^\d+$/.test(core)) {
    // Angka tetap utuh (contoh: Seksi 2, Proyek 01)
    formatted = core;
  } else {
    // Title Case standar
    formatted = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
  }

  if (startsWithParen) formatted = '(' + formatted;
  if (endsWithParen) formatted = formatted + ')';
  return formatted;
}

/**
 * Format nama entitas/perusahaan/proyek/kuari/investor secara real-time saat mengetik.
 * Mendukung huruf, angka, spasi, tanda kurung ( ), dan tanda hubung (-).
 * Preservasi trailing space agar pengguna bisa terus mengetik tanpa kursor loncat.
 */
export function formatEntityNameLive(input: string): string {
  if (!input) return '';

  // 1. Bersihkan simbol selain alfabet, angka, spasi, (), dan -
  const sanitized = input.replace(/[^a-zA-Z0-9\s()\-]/g, '');

  // 2. Deteksi trailing space
  const hasTrailingSpace = /\s$/.test(sanitized);

  // 3. Pisahkan berdasarkan spasi
  const words = sanitized.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return hasTrailingSpace ? ' ' : '';
  }

  // 4. Format setiap kata
  const formattedWords = words.map(w => {
    // Tangani kata yang memiliki tanda hubung - (contoh: Cilegon-Anyer)
    if (w.includes('-')) {
      return w.split('-').map(formatNameWord).join('-');
    }
    return formatNameWord(w);
  });

  const joined = formattedWords.join(' ');
  return hasTrailingSpace ? joined + ' ' : joined;
}

/**
 * Format nama entitas final (bersih dari spasi berlebih)
 */
export function formatEntityName(input: string): string {
  if (!input) return '';
  return formatEntityNameLive(input).trim();
}

/**
 * Format nama orang/supir/PIC (hanya alfabet, spasi, dan kurung opsional)
 */
export function formatPersonNameLive(input: string): string {
  if (!input) return '';
  // Hanya izinkan huruf, spasi, dan tanda kurung
  const sanitized = input.replace(/[^a-zA-Z\s()]/g, '');
  const hasTrailingSpace = /\s$/.test(sanitized);

  const words = sanitized.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return hasTrailingSpace ? ' ' : '';
  }

  const formattedWords = words.map(formatNameWord);
  const joined = formattedWords.join(' ');
  return hasTrailingSpace ? joined + ' ' : joined;
}

/**
 * Format nama orang/supir/PIC final
 */
export function formatPersonName(input: string): string {
  if (!input) return '';
  return formatPersonNameLive(input).trim();
}
