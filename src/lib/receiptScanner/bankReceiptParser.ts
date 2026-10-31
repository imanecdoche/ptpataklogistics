export interface ParsedBankReceipt {
  date?: string;            // YYYY-MM-DD
  amount?: number;          // Nominal bersih (bebas biaya admin)
  adminFee?: number;        // Biaya admin terdeteksi (misal: 2500, 6500)
  totalDebited?: number;    // Total yang didebet termasuk admin
  referenceId?: string;     // No. Ref / ID Transaksi
  sourceBank?: string;      // Bank pengirim
  destinationBank?: string; // Bank penerima
  recipientName?: string;   // Nama penerima
  notesSummary?: string;    // Rincian keterangan otomatis
  rawText: string;
}

const BANK_NAMES = [
  'BCA',
  'MANDIRI',
  'BRI',
  'BNI',
  'BSI',
  'CIMB NIAGA',
  'CIMB',
  'PERMATA',
  'DANAMON',
  'PANIN',
  'BTN',
  'MAYBANK',
  'BTPN',
  'JENIUS',
  'BANK JAGO',
  'JAGO',
  'SEABANK',
  'ALLO BANK',
  'NEO COMMERCE',
  'FLIP',
  'SHOPEEPAY',
  'GOPAY',
  'OVO'
];

const MONTH_MAP: Record<string, string> = {
  jan: '01', januari: '01', january: '01',
  feb: '02', februari: '02', february: '02',
  mar: '03', maret: '03', march: '03',
  apr: '04', april: '04',
  mei: '05', may: '05',
  jun: '06', juni: '06', june: '06',
  jul: '07', juli: '07', july: '07',
  agu: '08', agustus: '08', aug: '08', august: '08',
  sep: '09', september: '09',
  okt: '10', oktober: '10', oct: '10', october: '10',
  nov: '11', november: '11',
  des: '12', desember: '12', dec: '12', december: '12'
};

/**
 * Mengubah string uang mentah (Rp 1.000.000,00 atau 1,000,000.00) menjadi integer number murni
 */
export function parseRupiahNumber(str: string): number {
  if (!str) return 0;
  let clean = str.replace(/rp\.?/gi, '').trim();

  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    const parts = clean.split(',');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      clean = clean.replace(/,/g, '');
    } else {
      clean = clean.replace(',', '.');
    }
  } else if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length > 2 || (parts[1] && parts[1].length === 3)) {
      clean = clean.replace(/\./g, '');
    }
  }

  const num = Math.round(parseFloat(clean));
  return isNaN(num) ? 0 : num;
}

/**
 * Menganalisis teks bukti transfer hasil OCR untuk mengekstrak data terstruktur
 */
export function parseBankReceiptText(rawText: string): ParsedBankReceipt {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: ParsedBankReceipt = {
    rawText
  };

  let detectedNominal = 0;
  let detectedTotal = 0;
  let detectedAdminFee = 0;
  let foundDate: string | undefined = undefined;
  let foundRef: string | undefined = undefined;
  let sourceBank: string | undefined = undefined;
  let destBank: string | undefined = undefined;
  let recipientName: string | undefined = undefined;

  // 1. Deteksi Bank Pengirim & Penerima
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const upper = line.toUpperCase();
    
    // Abaikan jika hanya kata 'sumber dana'
    if (upper.includes('SUMBER DANA') && !upper.includes('BRI') && !upper.includes('BCA') && !upper.includes('MANDIRI')) {
      const nextUpper = (lines[i + 1] || '').toUpperCase();
      for (const b of BANK_NAMES) {
        if (nextUpper.includes(b)) {
          sourceBank = b;
          break;
        }
      }
      continue;
    }

    if (upper.includes('DARI REKENING') || upper.includes('REKENING SUMBER') || upper.includes('PENGIRIM')) {
      const nextUpper = (lines[i + 1] || '').toUpperCase();
      for (const b of BANK_NAMES) {
        if (upper.includes(b) || nextUpper.includes(b)) {
          sourceBank = b;
          break;
        }
      }
    }

    if (upper.includes('KE REKENING') || upper.includes('REKENING TUJUAN') || upper.includes('TUJUAN')) {
      const nextUpper = (lines[i + 1] || '').toUpperCase();
      for (const b of BANK_NAMES) {
        if (upper.includes(b) || nextUpper.includes(b)) {
          destBank = b;
          break;
        }
      }
    }

    // Generic match
    for (const b of BANK_NAMES) {
      if (upper.includes(b)) {
        if (!sourceBank) {
          sourceBank = b;
        } else if (sourceBank !== b && !destBank) {
          destBank = b;
        }
      }
    }
  }

  // 2. Deteksi Tanggal Transaksi
  for (const line of lines) {
    if (foundDate) break;

    // Format DD/MM/YYYY atau DD-MM-YYYY
    const dmyMatch = line.match(/\b([0-3]?\d)[\/\-]([0-1]?\d)[\/\-](202\d)\b/);
    if (dmyMatch) {
      const day = String(dmyMatch[1]).padStart(2, '0');
      const month = String(dmyMatch[2]).padStart(2, '0');
      const year = dmyMatch[3];
      foundDate = `${year}-${month}-${day}`;
      break;
    }

    // Format DD Bulan YYYY (misal: 31 Okt 2026 atau 31 Oktober 2026)
    const textMonthMatch = line.match(/\b([0-3]?\d)\s+([a-zA-Z]{3,9})\s+(202\d)\b/);
    if (textMonthMatch) {
      const day = String(textMonthMatch[1]).padStart(2, '0');
      const mStr = textMonthMatch[2]?.toLowerCase() || '';
      const year = textMonthMatch[3];
      const mNum = MONTH_MAP[mStr];
      if (mNum) {
        foundDate = `${year}-${mNum}-${day}`;
        break;
      }
    }
  }

  // 3. Deteksi Nomor Referensi Transaksi
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const lower = line.toLowerCase();

    if (
      lower.includes('ref') ||
      lower.includes('referensi') ||
      lower.includes('id transaksi') ||
      lower.includes('no transaksi') ||
      lower.includes('jurnal') ||
      lower.includes('trace no')
    ) {
      // Jika ada tanda titik dua ':'
      if (line.includes(':')) {
        const afterColon = line.substring(line.indexOf(':') + 1).trim();
        const codeMatch = afterColon.match(/([a-zA-Z0-9\-_]{5,35})/);
        if (codeMatch && codeMatch[1]) {
          foundRef = codeMatch[1].trim();
          break;
        }
      }

      // Cek baris berikutnya jika baris saat ini hanya judul/label
      const nextLine = (lines[i + 1] || '').trim();
      const nextMatch = nextLine.match(/^([a-zA-Z0-9\-_]{5,35})$/);
      if (nextMatch && nextMatch[1]) {
        foundRef = nextMatch[1].trim();
        break;
      }
    }
  }

  // 4. Deteksi Nama Penerima
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const lower = line.toLowerCase();

    if (
      lower.includes('nama penerima') ||
      lower.includes('penerima') ||
      lower.includes('transfer ke') ||
      lower.includes('tujuan')
    ) {
      // Jika ada teks setelah titik dua
      if (line.includes(':')) {
        const afterColon = line.substring(line.indexOf(':') + 1).trim();
        if (afterColon && afterColon.length >= 3 && !/^\d+$/.test(afterColon) && !BANK_NAMES.includes(afterColon.toUpperCase())) {
          recipientName = afterColon.replace(/rekening|bank/gi, '').trim();
          break;
        }
      }

      // Baris berikutnya
      const next = (lines[i + 1] || '').trim();
      if (
        next &&
        next.length >= 3 &&
        !/^\d+$/.test(next) &&
        !next.toLowerCase().includes('rp') &&
        !BANK_NAMES.includes(next.toUpperCase()) &&
        !next.toLowerCase().includes('nominal')
      ) {
        recipientName = next.replace(/rekening|bank/gi, '').trim();
        break;
      }
    }
  }

  // 5. Deteksi Biaya Admin Antar-Bank
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const lower = line.toLowerCase();

    if (
      lower.includes('admin') ||
      lower.includes('biaya transaksi') ||
      lower.includes('biaya transfer') ||
      lower.includes('fee')
    ) {
      if (lower.includes('gratis') || lower.includes('free') || lower.includes('rp 0')) {
        detectedAdminFee = 0;
        break;
      }

      // Coba temukan angka di baris ini
      const moneyMatch = line.match(/rp\.?\s*([0-9\.,]+)/i);
      if (moneyMatch && moneyMatch[1]) {
        const val = parseRupiahNumber(moneyMatch[1]);
        if (val > 0 && val < 50000) {
          detectedAdminFee = val;
          break;
        }
      }

      // Coba temukan angka di baris berikutnya
      const next = lines[i + 1] || '';
      const nextMatch = next.match(/rp\.?\s*([0-9\.,]+)/i);
      if (nextMatch && nextMatch[1]) {
        const val = parseRupiahNumber(nextMatch[1]);
        if (val > 0 && val < 50000) {
          detectedAdminFee = val;
          break;
        }
      }
    }
  }

  // 6. Deteksi Nominal Transfer Murni vs Total Transaksi
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';
    const lower = line.toLowerCase();

    // Nominal Pokok
    if (
      (lower.includes('nominal') || lower.includes('jumlah transfer') || lower.includes('nilai transfer')) &&
      !lower.includes('total')
    ) {
      const match = line.match(/rp\.?\s*([0-9\.,]+)/i);
      if (match && match[1]) {
        const val = parseRupiahNumber(match[1]);
        if (val > 0) detectedNominal = val;
      } else {
        const next = lines[i + 1] || '';
        const nextMatch = next.match(/rp\.?\s*([0-9\.,]+)/i);
        if (nextMatch && nextMatch[1]) {
          const val = parseRupiahNumber(nextMatch[1]);
          if (val > 0) detectedNominal = val;
        }
      }
    }

    // Total Bayar / Total Debet
    if (lower.includes('total')) {
      const match = line.match(/rp\.?\s*([0-9\.,]+)/i);
      if (match && match[1]) {
        const val = parseRupiahNumber(match[1]);
        if (val > 0) detectedTotal = val;
      } else {
        const next = lines[i + 1] || '';
        const nextMatch = next.match(/rp\.?\s*([0-9\.,]+)/i);
        if (nextMatch && nextMatch[1]) {
          const val = parseRupiahNumber(nextMatch[1]);
          if (val > 0) detectedTotal = val;
        }
      }
    }
  }

  // Fallback nominal jika belum terdeteksi dari kata kunci khusus
  if (!detectedNominal && !detectedTotal) {
    let maxCandidate = 0;
    for (const line of lines) {
      const match = line.match(/rp\.?\s*([0-9\.,]{4,})/i);
      if (match && match[1]) {
        const val = parseRupiahNumber(match[1]);
        if (val >= 5000 && val > maxCandidate && val !== detectedAdminFee) {
          maxCandidate = val;
        }
      }
    }
    detectedNominal = maxCandidate;
  }

  // 7. Hitung Nominal Kas Murni (Tanpa Biaya Admin)
  let cleanAmount = 0;
  if (detectedNominal > 0) {
    cleanAmount = detectedNominal;
  } else if (detectedTotal > 0) {
    if (detectedAdminFee > 0 && detectedTotal > detectedAdminFee) {
      cleanAmount = detectedTotal - detectedAdminFee;
    } else {
      cleanAmount = detectedTotal;
    }
  }

  result.date = foundDate;
  result.amount = cleanAmount > 0 ? cleanAmount : undefined;
  result.adminFee = detectedAdminFee > 0 ? detectedAdminFee : undefined;
  result.totalDebited = detectedTotal > 0 ? detectedTotal : undefined;
  result.referenceId = foundRef;
  result.sourceBank = sourceBank;
  result.destinationBank = destBank;
  result.recipientName = recipientName;

  // 8. Susun Rincian Catatan / Keterangan Otomatis
  const notesParts: string[] = [];
  if (sourceBank && destBank) {
    notesParts.push(`Transfer ${sourceBank} ke ${destBank}`);
  } else if (sourceBank) {
    notesParts.push(`Transfer via ${sourceBank}`);
  }

  if (recipientName) {
    notesParts.push(`an ${recipientName}`);
  }

  if (detectedAdminFee > 0) {
    notesParts.push(`(Biaya admin Rp ${detectedAdminFee.toLocaleString('id-ID')} dikecualikan dari kas)`);
  }

  result.notesSummary = notesParts.length > 0 ? notesParts.join(' ') : undefined;

  return result;
}
