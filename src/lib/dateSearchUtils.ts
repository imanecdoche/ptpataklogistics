/**
 * Utility untuk pencocokan tanggal search query secara global di seluruh tabel sistem.
 * Mendukung format standar Indonesia DD-MM-YY (contoh: "28-10-26"),
 * DD-MM-YYYY ("28-10-2026"), DD/MM/YY, DD.MM.YY, ISO YYYY-MM-DD,
 * serta pencarian parsial (DD-MM, MM-YY, nama bulan Indonesia: "28 Okt").
 */
export function matchesDateQuery(
  rawDate: string | undefined | null,
  rawQuery: string | undefined | null
): boolean {
  if (!rawDate || !rawQuery) return false;
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  // Ekstrak bagian YYYY-MM-DD dari rawDate
  // Mendukung: "2026-10-28", "2026-10-28T14:30:00Z", "2026-10-28 07:00", dsb.
  const isoMatch = String(rawDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!isoMatch) {
    return String(rawDate).toLowerCase().includes(q);
  }

  const yearFull = isoMatch[1] ?? ''; // "2026"
  const yearShort = yearFull.slice(-2); // "26"
  const monthNum = (isoMatch[2] ?? '').padStart(2, '0'); // "10"
  const dayNum = (isoMatch[3] ?? '').padStart(2, '0'); // "28"

  const dayInt = parseInt(dayNum, 10);
  const monthInt = parseInt(monthNum, 10);

  const monthNamesIdShort = [
    'jan', 'feb', 'mar', 'apr', 'mei', 'jun',
    'jul', 'agu', 'sep', 'okt', 'nov', 'des'
  ];
  const monthNamesIdFull = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  const mIndex = monthInt - 1;
  const monthShort = monthNamesIdShort[mIndex] || '';
  const monthFull = monthNamesIdFull[mIndex] || '';

  // Bangun seluruh representasi tanggal yang mungkin dicari user:
  const representations: string[] = [
    // Standar Indonesia DD-MM-YY & DD-MM-YYYY
    `${dayNum}-${monthNum}-${yearShort}`, // "28-10-26"
    `${dayNum}-${monthNum}-${yearFull}`,  // "28-10-2026"
    `${dayInt}-${monthInt}-${yearShort}`, // "28-10-26" atau "5-2-26"
    `${dayInt}-${monthInt}-${yearFull}`,
    `${dayNum}-${monthInt}-${yearShort}`,
    `${dayInt}-${monthNum}-${yearShort}`,

    // Format Slash DD/MM/YY & DD/MM/YYYY
    `${dayNum}/${monthNum}/${yearShort}`, // "28/10/26"
    `${dayNum}/${monthNum}/${yearFull}`,  // "28/10/2026"
    `${dayInt}/${monthInt}/${yearShort}`,
    `${dayInt}/${monthInt}/${yearFull}`,

    // Format Titik DD.MM.YY
    `${dayNum}.${monthNum}.${yearShort}`,
    `${dayNum}.${monthNum}.${yearFull}`,

    // Format Parsial DD-MM
    `${dayNum}-${monthNum}`,
    `${dayInt}-${monthInt}`,
    `${dayNum}/${monthNum}`,
    `${dayInt}/${monthInt}`,

    // Format Parsial MM-YY
    `${monthNum}-${yearShort}`,
    `${monthNum}/${yearShort}`,

    // Format Teks Bulan Indonesia
    `${dayNum} ${monthShort} ${yearFull}`,
    `${dayNum} ${monthShort} ${yearShort}`,
    `${dayNum} ${monthFull} ${yearFull}`,
    `${dayInt} ${monthShort} ${yearFull}`,
    `${dayInt} ${monthShort}`,
    `${dayNum} ${monthShort}`,
    `${dayNum} ${monthFull}`,

    // Format Asli ISO
    `${yearFull}-${monthNum}-${dayNum}`, // "2026-10-28"
    String(rawDate).toLowerCase()
  ];

  // Cek apakah query cocok langsung dengan salah satu representasi
  for (const rep of representations) {
    if (rep.toLowerCase().includes(q)) return true;
  }

  // Normalisasi pemisah: jika query memakai strip/garis miring/titik yang setara
  const normalizedQuery = q.replace(/[\/\.\s]/g, '-');
  for (const rep of representations) {
    const normalizedRep = rep.replace(/[\/\.\s]/g, '-');
    if (normalizedRep.includes(normalizedQuery)) return true;
  }

  return false;
}
