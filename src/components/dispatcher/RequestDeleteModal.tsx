import React, { useState } from 'react';
import { DispatchTransaction } from '@/types/database';
import { formatRupiah } from '@/lib/currencyUtils';

interface RequestDeleteModalProps {
  isOpen: boolean;
  transaction: DispatchTransaction | null;
  onSubmit: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function RequestDeleteModal({
  isOpen,
  transaction,
  onSubmit,
  onClose
}: RequestDeleteModalProps): React.JSX.Element | null {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Alasan penghapusan tiket wajib diisi');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      console.error('Gagal mengirim pengajuan hapus tiket:', err);
      setError('Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Surface Dialog */}
      <div 
        className="relative w-full max-w-md bg-white rounded-t-[20px] md:rounded-[12px] my-0 md:my-6 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#eaeaea] bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-bold text-[#111111]">
                Ajukan Penghapusan Tiket
              </h3>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Tiket ritase akan diajukan ke Atasan (Admin/Founder) untuk di-ACC.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#888888] hover:text-[#111111] p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Card Ringkasan Tiket */}
          <div className="p-3 bg-[#fafafa] border border-[#eaeaea] rounded-[8px] text-xs space-y-1.5">
            <div className="flex justify-between items-center pb-1.5 border-b border-[#ececec]">
              <span className="text-[#666666]">Nomor Tiket:</span>
              <span className="font-mono font-bold text-[#111111]">{transaction.ticketNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Armada / Sopir:</span>
              <span className="font-medium text-[#111111]">
                {transaction.truckPlate} {transaction.driverName ? `(${transaction.driverName})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Material & Muatan:</span>
              <span className="font-medium text-[#111111]">
                {transaction.materialName} ({transaction.quantity} {transaction.unit})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#666666]">Total Tagihan:</span>
              <span className="font-bold text-[#111111]">{formatRupiah(transaction.totalRevenue)}</span>
            </div>
          </div>

          {/* Alasan Penghapusan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111111] block">
              Alasan Penghapusan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              rows={3}
              placeholder="Contoh: Salah input kuari asal, tiket ganda di lapangan, armada batal jalan, dll."
              className="w-full text-xs p-3 rounded-[8px] border border-[#dcdcdc] focus:border-[#111111] focus:ring-0 outline-none text-[#111111] placeholder:text-[#999999] resize-none"
              autoFocus
            />
            {error && (
              <p className="text-[11px] font-medium text-red-600">{error}</p>
            )}
          </div>

          {/* Alert Info */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-[8px] flex items-start gap-2.5">
            <span className="text-amber-600 text-sm">ℹ️</span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Setelah dikirim, tiket ini akan ditandai dengan status <span className="font-bold">"Menunggu ACC Hapus"</span> dan notifikasi langsung diteruskan ke dasbor Atasan.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#666666] hover:text-[#111111] hover:bg-[#f0f0f0] rounded-[8px] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <span>Kirim Permohonan Hapus</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
