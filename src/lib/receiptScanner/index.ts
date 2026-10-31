import { performOcr } from './tesseractOcr';
import { parseBankReceiptText, ParsedBankReceipt } from './bankReceiptParser';

export type { ParsedBankReceipt };

/**
 * Memindai file foto bukti transfer (tangkapan layar m-banking / struk) secara lokal di browser,
 * mengekstrak tanggal, nomor referensi, asal/tujuan bank, penerima, dan nominal bersih bebas biaya admin.
 */
export async function scanAndParseReceipt(
  imageSource: File | Blob | string,
  onProgress?: (progressPercent: number, statusMessage: string) => void
): Promise<ParsedBankReceipt> {
  const rawText = await performOcr(imageSource, onProgress);
  return parseBankReceiptText(rawText);
}
