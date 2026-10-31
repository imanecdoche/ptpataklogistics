import React, { useState } from 'react';
import { CashLedgerEntry } from '@/types/database';
import { deleteCashLedgerEntry } from '@/lib/cashLedgerService';
import { formatRupiah } from '@/lib/currencyUtils';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { X, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface DeleteCashLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CashLedgerEntry | null;
  onSuccess: () => void;
}

export function DeleteCashLedgerModal({
  isOpen,
  onClose,
  entry,
  onSuccess
}: DeleteCashLedgerModalProps): React.JSX.Element | null {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  const handlePreDelete = (): void => {
    setErrorMsg(null);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (): Promise<void> => {
    setIsPinModalOpen(false);
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await deleteCashLedgerEntry(entry.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Gagal menghapus entri mutasi kas:', err);
      setErrorMsg('Terjadi kesalahan saat menghapus mutasi kas dari database.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

        {/* Modal Surface */}
        <div className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] flex flex-col max-h-[92vh] md:max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out z-10 border-none">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-[#cf1124]">
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <h3 className="text-sm font-bold text-[#111111]">
                Hapus Mutasi Kas
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#888888] hover:text-[#111111] p-1 rounded transition-colors cursor-pointer border-none bg-transparent"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
            {errorMsg && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-[6px] font-medium flex items-center gap-2 border-none">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-[#fafafa] rounded-[8px] space-y-2 border-none text-xs">
              <div className="flex justify-between items-center text-[#777777]">
                <span>Tanggal</span>
                <span className="font-mono text-[#111111]">{entry.date ? entry.date.slice(0, 10) : '-'}</span>
              </div>
              <div className="flex justify-between items-center text-[#777777]">
                <span>Kategori</span>
                <span className="font-semibold text-[#111111]">{entry.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between items-center text-[#777777]">
                <span>Deskripsi</span>
                <span className="font-medium text-[#111111] text-right truncate max-w-[200px]">{entry.description}</span>
              </div>
              {entry.referenceId && (
                <div className="flex justify-between items-center text-[#777777]">
                  <span>No. Referensi</span>
                  <span className="font-mono text-[#111111]">{entry.referenceId}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#ececec]">
                <span className="font-medium">Nominal Mutasi</span>
                <span className={`text-sm font-bold ${entry.isCredit ? 'text-emerald-700' : 'text-[#cf1124]'}`}>
                  {entry.isCredit ? '+ ' : '- '}
                  {formatRupiah(entry.amount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#666666] leading-relaxed">
              Apakah Anda yakin ingin menghapus mutasi ini? Data yang dihapus tidak dapat dipulihkan dan saldo berjalan seluruh pembukuan kas akan otomatis disinkronkan kembali.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#eaeaea] bg-white flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-[#555555] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[8px] border-none transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePreDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#cf1124] hover:bg-[#b00f1f] rounded-[8px] border-none transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Mutasi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PIN Auth Modal */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Otorisasi Hapus Mutasi Kas"
        description="Masukkan PIN Keamanan untuk mengonfirmasi penghapusan entri kas dan sinkronisasi saldo."
      />
    </>
  );
}
