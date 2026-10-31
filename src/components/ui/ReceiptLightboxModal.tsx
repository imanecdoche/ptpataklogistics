import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ReceiptLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
}

export function ReceiptLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Bukti Kwitansi / Transaksi'
}: ReceiptLightboxModalProps): React.JSX.Element | null {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `bukti-transaksi-${Date.now()}.jpg`;
    target: '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
      />

      {/* Surface: Flat Filled Card, Zero Outline Stroke */}
      <div className="relative w-full max-w-2xl bg-white rounded-[12px] flex flex-col max-h-[92vh] overflow-hidden shadow-2xl z-10 border-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-bold text-[#111111] tracking-tight">{title}</h3>
            <p className="text-[11px] text-[#666666] mt-0.5">Dokumen lampiran transaksi keuangan</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] rounded-[6px] border-none cursor-pointer transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#f8f8f8]">
          <img
            src={imageUrl}
            alt="Bukti Transaksi"
            className="max-w-full max-h-[65vh] object-contain rounded-[6px] shadow-sm select-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-white flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] text-xs font-semibold rounded-[6px] border-none cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Berkas</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#111111] text-xs font-semibold rounded-[6px] border-none transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Tab Baru</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#111111] hover:bg-[#2b2b2b] text-white text-xs font-semibold rounded-[6px] border-none cursor-pointer transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
