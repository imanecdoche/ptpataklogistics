import React, { useRef, useState } from 'react';
import { Upload, Trash2, Eye, Loader2, Sparkles } from 'lucide-react';
import { uploadReceiptImage } from '@/lib/storageService';
import { ReceiptLightboxModal } from './ReceiptLightboxModal';
import { scanAndParseReceipt, ParsedBankReceipt } from '@/lib/receiptScanner';

interface ReceiptUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  onScanComplete?: (data: ParsedBankReceipt) => void;
}

export function ReceiptUpload({
  value,
  onChange,
  label = 'Lampirkan Bukti / Kwitansi',
  folder = 'receipts',
  onScanComplete
}: ReceiptUploadProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('Memindai detail bukti transfer...');
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Format berkas harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setDetectedSummary(null);

    try {
      // 1. Simpan gambar secara instan
      const url = await uploadReceiptImage(file, folder);
      onChange(url);
      setIsUploading(false);

      // 2. Jika ada handler scan cerdas, jalankan OCR di background
      if (onScanComplete) {
        setIsScanning(true);
        setScanMessage('Memindai detail bukti transfer...');

        try {
          const parsed = await scanAndParseReceipt(file, (pct) => {
            if (pct > 0) setScanMessage(`Membaca teks (${pct}%)...`);
          });

          // Panggil auto-fill ke form
          onScanComplete(parsed);

          // Siapkan ringkasan hasil deteksi untuk ditampilkan ke pengguna
          const details: string[] = [];
          if (parsed.sourceBank && parsed.destinationBank) {
            details.push(`${parsed.sourceBank} -> ${parsed.destinationBank}`);
          } else if (parsed.sourceBank) {
            details.push(parsed.sourceBank);
          }

          if (parsed.amount) {
            details.push(`Rp ${parsed.amount.toLocaleString('id-ID')}`);
          }

          if (parsed.adminFee) {
            details.push(`(Admin Rp ${parsed.adminFee.toLocaleString('id-ID')} dipisahkan)`);
          }

          if (details.length > 0) {
            setDetectedSummary(details.join(' | '));
          }
        } catch (scanErr) {
          console.warn('Scan bukti transfer tidak menghasilkan data otomatis:', scanErr);
        } finally {
          setIsScanning(false);
        }
      }
    } catch (err: any) {
      console.error('Gagal mengunggah foto bukti:', err);
      setErrorMessage('Gagal memproses gambar. Silakan coba lagi.');
      setIsUploading(false);
      setIsScanning(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setDetectedSummary(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-[#666666] tracking-tight">
          {label}
        </label>
        {value && (
          <span className="text-[10px] font-semibold text-[#008060] bg-[#e6f4ea] px-1.5 py-0.5 rounded-[4px] border-none">
            Terlampir
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {isUploading ? (
        <div className="p-3 bg-[#f5f5f5] rounded-[8px] flex items-center justify-center gap-2 text-xs text-[#555555] font-medium border-none">
          <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
          <span>Memproses gambar...</span>
        </div>
      ) : value ? (
        <div className="space-y-2">
          <div className="p-2.5 bg-[#f5f5f5] rounded-[8px] flex items-center justify-between gap-3 border-none">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={value}
                alt="Bukti Transaksi"
                className="w-10 h-10 object-cover rounded-[6px] flex-shrink-0 bg-[#ebebeb]"
              />
              <div className="overflow-hidden">
                <span className="text-xs font-semibold text-[#111111] block truncate">
                  Bukti Transaksi Fisik
                </span>
                <span className="text-[10px] text-[#777777] block">
                  Gambar siap disimpan
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#e8e8e8] hover:bg-[#dedede] text-[#111111] text-[11px] font-semibold rounded-[6px] border-none cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat</span>
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fce8e6] hover:bg-[#fad2cf] text-[#cf1124] text-[11px] font-semibold rounded-[6px] border-none cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          {/* Indikator Pemindaian Teks Otomatis */}
          {isScanning && (
            <div className="p-2 bg-[#f0f4f8] rounded-[6px] flex items-center gap-2 text-[11px] text-[#1a73e8] font-medium border-none">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Ringkasan Hasil Deteksi Cerdas */}
          {!isScanning && detectedSummary && (
            <div className="p-2 bg-[#e8f0fe] rounded-[6px] flex items-center gap-2 text-[11px] text-[#1a73e8] font-medium border-none">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-[#1a73e8]" />
              <div className="truncate">
                <span className="font-bold">Terdeteksi Otomatis: </span>
                <span>{detectedSummary}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] flex items-center justify-center gap-2 text-center cursor-pointer transition-colors border-none group select-none"
        >
          <Upload className="w-4 h-4 text-[#666666] group-hover:text-[#111111] transition-colors" />
          <span className="text-xs font-medium text-[#555555] group-hover:text-[#111111] transition-colors">
            Pilih Foto Bukti Transfer / Kwitansi (JPG, PNG)
          </span>
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] text-[#cf1124] font-medium">{errorMessage}</p>
      )}

      <ReceiptLightboxModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={value || null}
      />
    </div>
  );
}
